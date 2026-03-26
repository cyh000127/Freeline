package com.freeline.domain.boothmap.service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;

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

import tools.jackson.databind.ObjectMapper;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BoothMapService {

    private static final String MAP_DIRECTORY = "map";

    private static final List<WaitingStatus> MAP_ACTIVE_WAITING_STATUSES = List.of(
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED
    );

    private final EventRepository eventRepository;
    private final BoothRepository boothRepository;
    private final BoothWaitingRepository boothWaitingRepository;
    private final EventMapRepository eventMapRepository;
    private final BoothMapAreaRepository boothMapAreaRepository;
    private final FileService fileService;
    private final AiVisionClient aiVisionClient;
    private final ObjectMapper objectMapper;

    @Transactional
    public void bulkUpsertBoothMapAreas(final Long eventId, final BoothMapAreaBulkUpsertReqDto request) {
        validateEventOwnership(eventId);

        final EventMap eventMap = eventMapRepository.findById(request.eventMapId())
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_MAP_NOT_FOUND));

        if (!eventMap.getEventId().equals(eventId)) {
            throw new BoothException(ErrorCode.BOOTH_EVENT_MISMATCH);
        }

        // Validate boothIds belong to event
        List<Long> requestedBoothIds = request.areas().stream()
                .map(BoothMapAreaBulkUpsertReqDto.AreaItem::boothId)
                .toList();
        List<Booth> validBooths = boothRepository.findAllByEventIdOrderByIdAsc(eventId);
        List<Long> validBoothIds = validBooths.stream().map(Booth::getId).toList();

        boolean allValid = requestedBoothIds.stream().allMatch(validBoothIds::contains);
        if (!allValid) {
            throw new BoothException(ErrorCode.BOOTH_NOT_FOUND);
        }

        // Sync Logic
        List<BoothMapArea> existingAreas = boothMapAreaRepository.findAllByEventMapIdOrderByIdAsc(eventMap.getId());
        Map<Long, BoothMapArea> existingAreaMap = existingAreas.stream()
                .collect(Collectors.toMap(BoothMapArea::getBoothId, Function.identity()));

        List<BoothMapArea> newAreas = new java.util.ArrayList<>();
        List<BoothMapArea> areasToDelete = new java.util.ArrayList<>();

        for (BoothMapAreaBulkUpsertReqDto.AreaItem item : request.areas()) {
            BoothMapArea existing = existingAreaMap.remove(item.boothId());
            if (existing != null) {
                existing.updateRect(item.xRatio(), item.yRatio(), item.widthRatio(), item.heightRatio());
                newAreas.add(existing);
            } else {
                newAreas.add(BoothMapArea.builder()
                        .eventMapId(eventMap.getId())
                        .boothId(item.boothId())
                        .xRatio(item.xRatio())
                        .yRatio(item.yRatio())
                        .widthRatio(item.widthRatio())
                        .heightRatio(item.heightRatio())
                        .build());
            }
        }

        areasToDelete.addAll(existingAreaMap.values());
        boothMapAreaRepository.deleteAll(areasToDelete);
        boothMapAreaRepository.saveAll(newAreas);

        // 3. 대표 지도 설정 로직 (기존 딱지 떼기)
        if (!eventMap.isVisible()) {
            eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(eventId)
                    .ifPresent(visibleMap -> visibleMap.update(visibleMap.getImagePath(), false));
            eventMap.update(eventMap.getImagePath(), true);
        }

        log.info("[BoothMap] 일괄 영역 저장 및 대표지도 설정 완료 {eventId: {}, eventMapId: {}, areaCount: {}}",
                eventId, eventMap.getId(), newAreas.size());
    }

    @Transactional
    public void updateMappingSnapshot(final Long eventId, final com.freeline.domain.boothmap.dto.request.MappingSnapshotUpdateReqDto request) {
        validateEventOwnership(eventId);

        final EventMap eventMap = eventMapRepository.findById(request.eventMapId())
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_MAP_NOT_FOUND));

        if (!eventMap.getEventId().equals(eventId)) {
            throw new BoothException(ErrorCode.BOOTH_EVENT_MISMATCH);
        }

        try {
            objectMapper.readTree(request.mappingSnapshot());
        } catch (Exception e) {
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

        List<BoothAreaDraftDto> drafts = Collections.emptyList();
        if (booths.isEmpty() && eventMap.getMappingSnapshot() != null && !eventMap.getMappingSnapshot().isBlank()) {
            try {
                drafts = objectMapper.readValue(
                        eventMap.getMappingSnapshot(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, BoothAreaDraftDto.class)
                );
            } catch (Exception e) {
                log.warn("[BoothMap] 스냅샷 파싱 실패 {eventMapId: {}}", eventMap.getId(), e);
            }
        }

        return BoothMapResDto.builder()
                .eventId(eventId)
                .eventMapId(eventMap.getId())
                .mapImageUrl(eventMap.getImagePath())
                .booths(booths)
                .drafts(drafts)
                .build();
    }

    public EventMapUploadResDto upsertEventMap(final Long eventId, final MultipartFile file, final boolean visible) {
        validateEventOwnership(eventId);
        final FileInfo uploadedFile = fileService.uploadFile(file, MAP_DIRECTORY);

        // 1. 기존 로직 (DB에 이미지 정보 저장 및 대표지도 체크 떼기)
        final EventMap eventMap = eventMapRepository.findFirstByEventIdOrderByIdDesc(eventId)
                .map(existing -> {
                    existing.update(uploadedFile.fileUrl(), visible);
                    return existing;
                })
                .orElseGet(() -> EventMap.builder()
                        .eventId(eventId)
                        .imagePath(uploadedFile.fileUrl())
                        .visible(visible)
                        .build());

        final EventMap saved = eventMapRepository.save(eventMap);

        if (visible) {
            eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(eventId)
                    .filter(visibleMap -> !visibleMap.getId().equals(saved.getId()))
                    .ifPresent(visibleMap -> visibleMap.update(visibleMap.getImagePath(), false));
        }

        // 2. AI 분석 요청 및 예외 처리 (실패 시에도 업로드는 유지)
        List<BoothAreaDraftDto> drafts = Collections.emptyList();
        try {
            AiVisionClient.AiAnalysisResult aiResult = aiVisionClient.analyzeMapImage(saved.getImagePath());
            drafts = convertToRatioDrafts(aiResult);
            log.info("[BoothMap] AI 분석 성공: {}개의 부스 감지", drafts.size());

            // AI 분석 결과를 JSON String으로 변환하여 임시 스냅샷으로 저장
            if (!drafts.isEmpty()) {
                String snapshotJson = objectMapper.writeValueAsString(drafts);
                saved.updateMappingSnapshot(snapshotJson);
                eventMapRepository.save(saved); // Update the snapshot in DB
            }
        } catch (Exception e) {
            log.error("[BoothMap] AI 이미지 분석 실패 (지도는 정상 저장됨) {eventMapId: {}}", saved.getId(), e);
        }

        log.info("[BoothMap] 행사 지도 저장 완료 {eventMapId: {}, eventId: {}, visible: {}}",
                saved.getId(), saved.getEventId(), saved.isVisible());

        // 3. 임시 부스 영역을 담아서 응답
        return EventMapUploadResDto.builder()
                .eventMapId(saved.getId())
                .eventId(saved.getEventId())
                .imagePath(saved.getImagePath())
                .isVisible(saved.isVisible())
                .drafts(drafts)
                .build();
    }

    /**
     * 픽셀(Pixel) 좌표를 DECIMAL(7, 4) 규격의 비율(Ratio)로 변환
     */
    private List<BoothAreaDraftDto> convertToRatioDrafts(AiVisionClient.AiAnalysisResult aiResult) {
        final BigDecimal imageWidth = BigDecimal.valueOf(aiResult.imageWidth());
        final BigDecimal imageHeight = BigDecimal.valueOf(aiResult.imageHeight());

        if (imageWidth.compareTo(BigDecimal.ZERO) <= 0 || imageHeight.compareTo(BigDecimal.ZERO) <= 0) {
            return Collections.emptyList();
        }

        return aiResult.booths().stream().map(rect -> {
            BigDecimal xRatio = BigDecimal.valueOf(rect.x()).divide(imageWidth, 4, java.math.RoundingMode.HALF_UP);
            BigDecimal yRatio = BigDecimal.valueOf(rect.y()).divide(imageHeight, 4, java.math.RoundingMode.HALF_UP);
            BigDecimal widthRatio = BigDecimal.valueOf(rect.width()).divide(imageWidth, 4, java.math.RoundingMode.HALF_UP);
            BigDecimal heightRatio = BigDecimal.valueOf(rect.height()).divide(imageHeight, 4, java.math.RoundingMode.HALF_UP);

            return BoothAreaDraftDto.builder()
                    .xRatio(xRatio)
                    .yRatio(yRatio)
                    .widthRatio(widthRatio)
                    .heightRatio(heightRatio)
                    .build();
        }).toList();
    }

    private BoothMapAreaResDto toBoothMapAreaResDto(final BoothMapArea area, final Booth booth) {
        if (booth == null) {
            throw new BoothException(ErrorCode.BOOTH_NOT_FOUND);
        }

        final long waitingCount = boothWaitingRepository.countByBoothIdAndStatusIn(booth.getId(), MAP_ACTIVE_WAITING_STATUSES);

        return BoothMapAreaResDto.builder()
                .areaId(area.getId())
                .boothId(booth.getId())
                .boothName(booth.getName())
                .locationCode(booth.getLocationCode())
                .waitingCount(waitingCount)
                .isEmergencyClosed(booth.isEmergencyClosed())
                .xRatio(area.getXRatio())
                .yRatio(area.getYRatio())
                .widthRatio(area.getWidthRatio())
                .heightRatio(area.getHeightRatio())
                .build();
    }

    private void validateEventExists(final Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new EventException(ErrorCode.EVENT_NOT_FOUND);
        }
    }

    private void validateEventOwnership(final Long eventId) {
        validateEventExists(eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_NOT_FOUND));

        String currentUserIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (currentUserIdStr != null && !currentUserIdStr.equals("anonymousUser")) {
            try {
                Long currentUserId = Long.parseLong(currentUserIdStr);
                if (!event.getEventAdminId().equals(currentUserId)) {
                    throw new EventException(ErrorCode.ACCESS_DENIED);
                }
            } catch (NumberFormatException e) {
                throw new EventException(ErrorCode.ACCESS_DENIED);
            }
        } else {
            throw new EventException(ErrorCode.ACCESS_DENIED);
        }
    }
}
