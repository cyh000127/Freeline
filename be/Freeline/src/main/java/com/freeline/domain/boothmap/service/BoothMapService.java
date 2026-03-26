package com.freeline.domain.boothmap.service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.file.dto.FileInfo;
import com.freeline.common.file.service.FileService;
import com.freeline.domain.auth.exception.AuthException;
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
    public void bulkUpsertBoothMapAreas(
            final Long eventAdminId,
            final Long eventId,
            final BoothMapAreaBulkUpsertReqDto request
    ) {
        getAuthorizedEvent(eventAdminId, eventId);
        final EventMap eventMap = getEventMap(eventId, request.eventMapId());
        validateBoothOwnership(eventId, request);

        boothMapAreaRepository.deleteAllByEventMapId(eventMap.getId());

        final List<BoothMapArea> newAreas = request.areas().stream()
                .map(item -> BoothMapArea.builder()
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
        eventMap.updateMappingSnapshot(null);

        if (!eventMap.isVisible()) {
            eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(eventId)
                    .ifPresent(visibleMap -> visibleMap.update(visibleMap.getImagePath(), false));
            eventMap.update(eventMap.getImagePath(), true);
        }

        log.info("[BoothMap] bulk area save completed {eventId: {}, eventMapId: {}, areaCount: {}}",
                eventId, eventMap.getId(), newAreas.size());
    }

    @Transactional
    public void updateMappingSnapshot(
            final Long eventAdminId,
            final Long eventId,
            final MappingSnapshotUpdateReqDto request
    ) {
        getAuthorizedEvent(eventAdminId, eventId);
        final EventMap eventMap = getEventMap(eventId, request.eventMapId());

        try {
            objectMapper.readTree(request.mappingSnapshot());
        } catch (Exception e) {
            throw new EventException(ErrorCode.JSON_PARSING_ERROR);
        }

        eventMap.updateMappingSnapshot(request.mappingSnapshot());
        log.info("[BoothMap] mapping snapshot updated {eventId: {}, eventMapId: {}}", eventId, eventMap.getId());
    }

    @Transactional(readOnly = true)
    public BoothMapResDto getBoothMap(final Long eventAdminId, final Long eventId) {
        getAuthorizedEvent(eventAdminId, eventId);

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
                .mappingSnapshot(eventMap.getMappingSnapshot())
                .booths(booths)
                .drafts(drafts)
                .build();
    }

    public EventMapUploadResDto upsertEventMap(
            final Long eventAdminId,
            final Long eventId,
            final MultipartFile file,
            final boolean visible
    ) {
        getAuthorizedEvent(eventAdminId, eventId);
        final FileInfo uploadedFile = fileService.uploadFile(file, MAP_DIRECTORY);

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
        saved.updateMappingSnapshot(null);

        if (visible) {
            eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(eventId)
                    .filter(visibleMap -> !visibleMap.getId().equals(saved.getId()))
                    .ifPresent(visibleMap -> visibleMap.update(visibleMap.getImagePath(), false));
        }

        List<BoothAreaDraftDto> drafts = Collections.emptyList();
        try {
            final AiVisionClient.AiAnalysisResult aiResult = aiVisionClient.analyzeMapImage(saved.getImagePath());
            drafts = convertToRatioDrafts(aiResult);
            log.info("[BoothMap] AI analysis completed {draftCount: {}}", drafts.size());

            if (!drafts.isEmpty()) {
                final String snapshotJson = objectMapper.writeValueAsString(Map.of("areas", drafts));
                saved.updateMappingSnapshot(snapshotJson);
                eventMapRepository.save(saved);
            }
        } catch (Exception e) {
            log.error("[BoothMap] AI image analysis failed but upload succeeded {eventMapId: {}}", saved.getId(), e);
        }

        log.info("[BoothMap] event map upload completed {eventMapId: {}, eventId: {}, visible: {}}",
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

        return aiResult.booths().stream().map(rect -> {
            final BigDecimal xRatio = BigDecimal.valueOf(rect.x()).divide(imageWidth, 4, java.math.RoundingMode.HALF_UP);
            final BigDecimal yRatio = BigDecimal.valueOf(rect.y()).divide(imageHeight, 4, java.math.RoundingMode.HALF_UP);
            final BigDecimal widthRatio = BigDecimal.valueOf(rect.width())
                    .divide(imageWidth, 4, java.math.RoundingMode.HALF_UP);
            final BigDecimal heightRatio = BigDecimal.valueOf(rect.height())
                    .divide(imageHeight, 4, java.math.RoundingMode.HALF_UP);

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

    private Event getAuthorizedEvent(final Long eventAdminId, final Long eventId) {
        final Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_NOT_FOUND));

        validateEventOwnership(eventAdminId, event);
        return event;
    }

    private EventMap getEventMap(final Long eventId, final Long eventMapId) {
        final EventMap eventMap = eventMapRepository.findById(eventMapId)
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_MAP_NOT_FOUND));

        if (!eventMap.getEventId().equals(eventId)) {
            throw new BoothException(ErrorCode.BOOTH_EVENT_MISMATCH);
        }

        return eventMap;
    }

    private void validateEventOwnership(final Long eventAdminId, final Event event) {
        if (!event.getEventAdminId().equals(eventAdminId)) {
            throw new AuthException(ErrorCode.ACCESS_DENIED);
        }
    }

    private void validateBoothOwnership(final Long eventId, final BoothMapAreaBulkUpsertReqDto request) {
        final List<Long> boothIds = request.areas().stream()
                .map(BoothMapAreaBulkUpsertReqDto.AreaItem::boothId)
                .distinct()
                .toList();

        final long matchedCount = boothRepository.countByIdInAndEventId(boothIds, eventId);
        if (matchedCount != boothIds.size()) {
            throw new BoothException(ErrorCode.BOOTH_EVENT_MISMATCH);
        }
    }

    private void validateEventOwnership(final Long eventId) {
        validateEventExists(eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_NOT_FOUND));

        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().equals("anonymousUser")) {
            throw new EventException(ErrorCode.ACCESS_DENIED);
        }

        try {
            Long currentUserId = Long.parseLong(auth.getName());
            if (!event.getEventAdminId().equals(currentUserId)) {
                throw new EventException(ErrorCode.ACCESS_DENIED);
            }
        } catch (NumberFormatException e) {
            throw new EventException(ErrorCode.ACCESS_DENIED);
        }
    }
}
