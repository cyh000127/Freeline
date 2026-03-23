package com.freeline.domain.boothmap.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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
import com.freeline.domain.boothmap.dto.request.BoothMapAreaUpsertReqDto;
import com.freeline.domain.boothmap.dto.response.BoothMapAreaResDto;
import com.freeline.domain.boothmap.dto.response.BoothMapAreaUpsertResDto;
import com.freeline.domain.boothmap.dto.response.BoothMapResDto;
import com.freeline.domain.boothmap.dto.response.EventMapUpsertResDto;
import com.freeline.domain.boothmap.entity.BoothMapArea;
import com.freeline.domain.boothmap.entity.EventMap;
import com.freeline.domain.boothmap.repository.BoothMapAreaRepository;
import com.freeline.domain.boothmap.repository.EventMapRepository;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventRepository;

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

    @Transactional(readOnly = true)
    public BoothMapResDto getBoothMap(final Long eventId) {
        validateEventExists(eventId);

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
                .build();
    }

    public BoothMapAreaUpsertResDto upsertBoothMapArea(
            final Long eventMapId,
            final Long boothId,
            final BoothMapAreaUpsertReqDto request
    ) {
        final EventMap eventMap = eventMapRepository.findById(eventMapId)
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_MAP_NOT_FOUND));
        final Booth booth = boothRepository.findById(boothId)
                .orElseThrow(() -> new BoothException(ErrorCode.BOOTH_NOT_FOUND));

        if (!eventMap.getEventId().equals(booth.getEventId())) {
            throw new BoothException(ErrorCode.BOOTH_EVENT_MISMATCH);
        }

        validateRect(request);

        final BoothMapArea area = boothMapAreaRepository.findByEventMapIdAndBoothId(eventMapId, boothId)
                .map(existing -> {
                    existing.updateRect(request.xRatio(), request.yRatio(), request.widthRatio(), request.heightRatio());
                    return existing;
                })
                .orElseGet(() -> BoothMapArea.builder()
                        .eventMapId(eventMapId)
                        .boothId(boothId)
                        .xRatio(request.xRatio())
                        .yRatio(request.yRatio())
                        .widthRatio(request.widthRatio())
                        .heightRatio(request.heightRatio())
                        .build());

        final BoothMapArea saved = boothMapAreaRepository.save(area);

        log.info("[BoothMap] 영역 저장 완료 {areaId: {}, eventMapId: {}, boothId: {}}", saved.getId(), eventMapId, boothId);

        return BoothMapAreaUpsertResDto.builder()
                .areaId(saved.getId())
                .eventMapId(saved.getEventMapId())
                .boothId(saved.getBoothId())
                .xRatio(saved.getXRatio())
                .yRatio(saved.getYRatio())
                .widthRatio(saved.getWidthRatio())
                .heightRatio(saved.getHeightRatio())
                .build();
    }

    public EventMapUpsertResDto upsertEventMap(final Long eventId, final MultipartFile file, final boolean visible) {
        validateEventExists(eventId);
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

        if (visible) {
            eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(eventId)
                    .filter(visibleMap -> !visibleMap.getId().equals(saved.getId()))
                    .ifPresent(visibleMap -> visibleMap.update(visibleMap.getImagePath(), false));
        }

        log.info("[BoothMap] 행사 지도 저장 완료 {eventMapId: {}, eventId: {}, visible: {}}",
                saved.getId(), saved.getEventId(), saved.isVisible());

        return EventMapUpsertResDto.builder()
                .eventMapId(saved.getId())
                .eventId(saved.getEventId())
                .imagePath(saved.getImagePath())
                .isVisible(saved.isVisible())
                .build();
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

    private void validateRect(final BoothMapAreaUpsertReqDto request) {
        final BigDecimal maxWidth = request.xRatio().add(request.widthRatio());
        final BigDecimal maxHeight = request.yRatio().add(request.heightRatio());

        if (maxWidth.compareTo(BigDecimal.ONE) > 0 || maxHeight.compareTo(BigDecimal.ONE) > 0) {
            throw new BoothException(ErrorCode.INVALID_BOOTH_MAP_AREA);
        }
    }
}
