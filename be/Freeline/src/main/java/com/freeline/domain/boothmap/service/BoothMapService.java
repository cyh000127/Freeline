package com.freeline.domain.boothmap.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.file.dto.FileInfo;
import com.freeline.common.file.service.FileService;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.boothmap.client.AiVisionClient;
import com.freeline.domain.boothmap.dto.request.BoothMapAreaBulkUpsertReqDto;
import com.freeline.domain.boothmap.dto.request.MappingSnapshotUpdateReqDto;
import com.freeline.domain.boothmap.dto.response.BoothAreaDraftDto;
import com.freeline.domain.boothmap.dto.response.BoothMapAreaResDto;
import com.freeline.domain.boothmap.dto.response.BoothMapResDto;
import com.freeline.domain.boothmap.dto.response.EventMapUploadResDto;
import com.freeline.domain.boothmap.entity.BoothMapArea;
import com.freeline.domain.boothmap.entity.EventMap;
import com.freeline.domain.boothmap.repository.BoothMapAreaRepository;
import com.freeline.domain.boothmap.repository.EventMapRepository;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventRepository;
import com.freeline.domain.waiting.service.WaitingPolicyResolver;

import tools.jackson.databind.ObjectMapper;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BoothMapService {

    private static final String MAP_DIRECTORY = "map";
    private static final int DEFAULT_STAY_TIME_SECONDS = 0;
    private static final int SECONDS_PER_MINUTE = 60;

    // [MODIFIED] 대기 인원과 예상 대기 시간의 기준을 WAITING, CALLED 상태로 통일한다.
    private static final List<WaitingStatus> MAP_ACTIVE_WAITING_STATUSES = List.of(
            WaitingStatus.WAITING,
            WaitingStatus.CALLED
    );

    private final EventRepository eventRepository;
    private final BoothRepository boothRepository;
    private final BoothWaitingRepository boothWaitingRepository;
    private final EventMapRepository eventMapRepository;
    private final BoothMapAreaRepository boothMapAreaRepository;
    private final FileService fileService;
    private final AiVisionClient aiVisionClient;
    private final ObjectMapper objectMapper;
    private final WaitingPolicyResolver waitingPolicyResolver;

    public void bulkUpsertBoothMapAreas(final Long eventId, final BoothMapAreaBulkUpsertReqDto request) {
        validateEventOwnership(eventId);

        final EventMap eventMap = getValidatedEventMap(eventId, request.eventMapId());
        final Set<Long> validBoothIds = boothRepository.findAllByEventIdOrderByIdAsc(eventId)
                .stream()
                .map(Booth::getId)
                .collect(Collectors.toSet());

        final boolean allValid = request.areas().stream()
                .map(BoothMapAreaBulkUpsertReqDto.AreaItem::boothId)
                .allMatch(validBoothIds::contains);
        if (!allValid) {
            throw new BoothException(ErrorCode.BOOTH_NOT_FOUND);
        }

        final Map<Long, BoothMapArea> existingAreaMap = boothMapAreaRepository.findAllByEventMapIdOrderByIdAsc(eventMap.getId())
                .stream()
                .collect(Collectors.toMap(BoothMapArea::getBoothId, Function.identity()));

        final List<BoothMapArea> areasToSave = new ArrayList<>();
        for (final BoothMapAreaBulkUpsertReqDto.AreaItem item : request.areas()) {
            final BoothMapArea existingArea = existingAreaMap.remove(item.boothId());
            if (existingArea != null) {
                existingArea.updateRect(item.xRatio(), item.yRatio(), item.widthRatio(), item.heightRatio());
                areasToSave.add(existingArea);
                continue;
            }

            areasToSave.add(BoothMapArea.builder()
                    .eventMapId(eventMap.getId())
                    .boothId(item.boothId())
                    .xRatio(item.xRatio())
                    .yRatio(item.yRatio())
                    .widthRatio(item.widthRatio())
                    .heightRatio(item.heightRatio())
                    .build());
        }

        final List<BoothMapArea> areasToDelete = new ArrayList<>(existingAreaMap.values());
        boothMapAreaRepository.deleteAll(areasToDelete);
        boothMapAreaRepository.saveAll(areasToSave);

        promoteVisibleMapIfNeeded(eventId, eventMap);

        log.info("[BoothMap] 일괄 영역 저장 및 대표지도 설정 완료 {eventId: {}, eventMapId: {}, areaCount: {}}",
                eventId, eventMap.getId(), areasToSave.size());
    }

    public void updateMappingSnapshot(final Long eventId, final MappingSnapshotUpdateReqDto request) {
        validateEventOwnership(eventId);

        final EventMap eventMap = getValidatedEventMap(eventId, request.eventMapId());

        try {
            objectMapper.readTree(request.mappingSnapshot());
        } catch (final Exception exception) {
            throw new EventException(ErrorCode.JSON_PARSING_ERROR);
        }

        eventMap.updateMappingSnapshot(request.mappingSnapshot());
        log.info("[BoothMap] 임시 스냅샷 저장 완료 {eventId: {}, eventMapId: {}}", eventId, eventMap.getId());
    }

    @Transactional(readOnly = true)
    public BoothMapResDto getBoothMap(final Long eventId) {
        validateEventOwnership(eventId);

        final EventMap eventMap = eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(eventId)
                .or(() -> eventMapRepository.findFirstByEventIdOrderByIdDesc(eventId))
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_MAP_NOT_FOUND));

        final Map<Long, Booth> boothsById = boothRepository.findAllByEventIdOrderByIdAsc(eventId)
                .stream()
                .collect(Collectors.toMap(Booth::getId, Function.identity()));

        final List<BoothMapAreaResDto> booths = boothMapAreaRepository.findAllByEventMapIdOrderByIdAsc(eventMap.getId())
                .stream()
                .map(area -> toBoothMapAreaResDto(area, boothsById.get(area.getBoothId())))
                .toList();

        return BoothMapResDto.builder()
                .eventId(eventId)
                .eventMapId(eventMap.getId())
                .mapImageUrl(eventMap.getImagePath())
                .booths(booths)
                .drafts(parseDrafts(eventMap))
                .build();
    }

    public EventMapUploadResDto upsertEventMap(final Long eventId, final MultipartFile file, final boolean visible) {
        validateEventOwnership(eventId);

        final FileInfo uploadedFile = fileService.uploadFile(file, MAP_DIRECTORY);
        final Optional<EventMap> previousVisibleMap = visible
                ? eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(eventId)
                : Optional.empty();

        final EventMap eventMap = EventMap.builder()
                .eventId(eventId)
                .imagePath(uploadedFile.fileUrl())
                .visible(visible)
                .build();

        final EventMap saved = eventMapRepository.save(eventMap);

        previousVisibleMap
                .filter(visibleMap -> !visibleMap.getId().equals(saved.getId()))
                .ifPresent(visibleMap -> visibleMap.update(visibleMap.getImagePath(), false));

        List<BoothAreaDraftDto> drafts = Collections.emptyList();
        try {
            final AiVisionClient.AiAnalysisResult aiResult = aiVisionClient.analyzeMapImage(saved.getImagePath());
            drafts = convertToRatioDrafts(aiResult);
            log.info("[BoothMap] AI 분석 성공: {}개의 부스 감지", drafts.size());

            if (!drafts.isEmpty()) {
                final String snapshotJson = objectMapper.writeValueAsString(drafts);
                saved.updateMappingSnapshot(snapshotJson);
                eventMapRepository.save(saved);
            }
        } catch (final Exception exception) {
            log.error("[BoothMap] AI 이미지 분석 실패 (지도는 정상 저장됨) {eventMapId: {}}", saved.getId(), exception);
        }

        log.info("[BoothMap] 행사 지도 저장 완료 {eventMapId: {}, eventId: {}, visible: {}}",
                saved.getId(), saved.getEventId(), saved.isVisible());

        return EventMapUploadResDto.builder()
                .eventMapId(saved.getId())
                .eventId(saved.getEventId())
                .imagePath(saved.getImagePath())
                .isVisible(saved.isVisible())
                .drafts(drafts)
                .build();
    }

    private List<BoothAreaDraftDto> convertToRatioDrafts(final AiVisionClient.AiAnalysisResult aiResult) {
        final BigDecimal imageWidth = BigDecimal.valueOf(aiResult.imageWidth());
        final BigDecimal imageHeight = BigDecimal.valueOf(aiResult.imageHeight());

        if (imageWidth.compareTo(BigDecimal.ZERO) <= 0 || imageHeight.compareTo(BigDecimal.ZERO) <= 0) {
            return Collections.emptyList();
        }

        return aiResult.booths().stream()
                .map(rect -> BoothAreaDraftDto.builder()
                        .xRatio(BigDecimal.valueOf(rect.x()).divide(imageWidth, 4, RoundingMode.HALF_UP))
                        .yRatio(BigDecimal.valueOf(rect.y()).divide(imageHeight, 4, RoundingMode.HALF_UP))
                        .widthRatio(BigDecimal.valueOf(rect.width()).divide(imageWidth, 4, RoundingMode.HALF_UP))
                        .heightRatio(BigDecimal.valueOf(rect.height()).divide(imageHeight, 4, RoundingMode.HALF_UP))
                        .build())
                .toList();
    }

    private BoothMapAreaResDto toBoothMapAreaResDto(final BoothMapArea area, final Booth booth) {
        if (booth == null) {
            throw new BoothException(ErrorCode.BOOTH_NOT_FOUND);
        }

        final long waitingCount = boothWaitingRepository.countByBoothIdAndStatusIn(booth.getId(), MAP_ACTIVE_WAITING_STATUSES);
        // [NEW] 지도 조회 응답에서 바로 사용할 수 있도록 예상 대기 시간을 함께 계산한다.
        final Long estimatedWaitTime = calculateEstimatedWaitTime(booth.getId(), waitingCount);

        return BoothMapAreaResDto.builder()
                .areaId(area.getId())
                .boothId(booth.getId())
                .boothName(booth.getName())
                .locationCode(booth.getLocationCode())
                .waitingCount(waitingCount)
                .estimatedWaitTime(estimatedWaitTime)
                .isEmergencyClosed(booth.isEmergencyClosed())
                .xRatio(area.getXRatio())
                .yRatio(area.getYRatio())
                .widthRatio(area.getWidthRatio())
                .heightRatio(area.getHeightRatio())
                .build();
    }

    // [NEW] WAITING, CALLED 상태 인원 수와 체류 정책을 기준으로 예상 대기 시간을 계산한다.
    private Long calculateEstimatedWaitTime(final Long boothId, final long waitingCount) {
        if (waitingCount <= 0) {
            return 0L;
        }

        final int stayTimeSeconds = waitingPolicyResolver.resolveStayTimeSeconds(boothId, DEFAULT_STAY_TIME_SECONDS);
        if (stayTimeSeconds <= 0) {
            return 0L;
        }

        return Math.ceilDiv(waitingCount * (long) stayTimeSeconds, SECONDS_PER_MINUTE);
    }

    private EventMap getValidatedEventMap(final Long eventId, final Long eventMapId) {
        final EventMap eventMap = eventMapRepository.findById(eventMapId)
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_MAP_NOT_FOUND));

        if (!eventMap.getEventId().equals(eventId)) {
            throw new BoothException(ErrorCode.BOOTH_EVENT_MISMATCH);
        }

        return eventMap;
    }

    private List<BoothAreaDraftDto> parseDrafts(final EventMap eventMap) {
        if (eventMap.getMappingSnapshot() == null || eventMap.getMappingSnapshot().isBlank()) {
            return Collections.emptyList();
        }

        try {
            final BoothAreaDraftDto[] drafts = objectMapper.readValue(
                    eventMap.getMappingSnapshot(),
                    BoothAreaDraftDto[].class
            );
            return Arrays.stream(drafts).toList();
        } catch (final Exception exception) {
            log.warn("[BoothMap] 스냅샷 파싱 실패 {eventMapId: {}}", eventMap.getId(), exception);
            return Collections.emptyList();
        }
    }

    private void promoteVisibleMapIfNeeded(final Long eventId, final EventMap eventMap) {
        if (eventMap.isVisible()) {
            return;
        }

        eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(eventId)
                .ifPresent(visibleMap -> visibleMap.update(visibleMap.getImagePath(), false));
        eventMap.update(eventMap.getImagePath(), true);
    }

    private void validateEventOwnership(final Long eventId) {
        final Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_NOT_FOUND));

        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().equals("anonymousUser")) {
            throw new EventException(ErrorCode.ACCESS_DENIED);
        }

        try {
            final Long currentUserId = Long.parseLong(authentication.getName());
            if (!event.getEventAdminId().equals(currentUserId)) {
                throw new EventException(ErrorCode.ACCESS_DENIED);
            }
        } catch (final NumberFormatException exception) {
            throw new EventException(ErrorCode.ACCESS_DENIED);
        }
    }
}
