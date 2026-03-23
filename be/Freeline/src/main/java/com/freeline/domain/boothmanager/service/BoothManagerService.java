package com.freeline.domain.boothmanager.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.boothmanager.converter.BoothManagerConverter;
import com.freeline.domain.boothmanager.dto.response.BoothManagerDashboardResDto;
import com.freeline.domain.boothmanager.dto.response.BoothManagerSummaryResDto;
import com.freeline.domain.boothmanager.dto.response.BoothManagerWaitingItemResDto;
import com.freeline.domain.waiting.dto.response.WaitingAdmitResDto;
import com.freeline.domain.waiting.dto.response.WaitingCallResDto;
import com.freeline.domain.waiting.service.WaitingService;

@Service
@Transactional
@RequiredArgsConstructor
public class BoothManagerService {

    private static final List<WaitingStatus> MANAGER_ACTIVE_STATUSES = List.of(
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED,
            WaitingStatus.ENTERED
    );

    private static final List<WaitingStatus> FRONT_QUEUE_STATUSES = List.of(
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED
    );

    private static final List<WaitingStatus> OTHER_BOOTH_BLOCKING_STATUSES = List.of(
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED,
            WaitingStatus.ENTERED
    );

    private final BoothRepository boothRepository;
    private final BoothWaitingRepository boothWaitingRepository;
    private final WaitingService waitingService;

    @Transactional(readOnly = true)
    public BoothManagerDashboardResDto getDashboard(final Long boothId) {
        final Booth booth = getBoothEntity(boothId);
        final List<BoothWaiting> activeWaitings = boothWaitingRepository.findWithVisitorByBoothIdAndStatusInOrderByWaitingNumberAsc(
                boothId,
                MANAGER_ACTIVE_STATUSES
        );

        final List<BoothManagerWaitingItemResDto> frontQueue = activeWaitings.stream()
                .filter(waiting -> FRONT_QUEUE_STATUSES.contains(waiting.getStatus()))
                .map(BoothManagerConverter::toWaitingItemResDto)
                .toList();

        final List<BoothManagerWaitingItemResDto> inUse = activeWaitings.stream()
                .filter(waiting -> waiting.getStatus() == WaitingStatus.ENTERED)
                .map(BoothManagerConverter::toWaitingItemResDto)
                .toList();

        final int blockedByOtherBoothCount = Math.toIntExact(activeWaitings.stream()
                .filter(waiting -> waiting.getStatus() == WaitingStatus.WAITING)
                .filter(waiting -> boothWaitingRepository.existsByVisitorIdAndBoothIdNotAndStatusIn(
                        waiting.getVisitorId(),
                        boothId,
                        OTHER_BOOTH_BLOCKING_STATUSES
                ))
                .count());

        final BoothManagerSummaryResDto summary = BoothManagerConverter.toSummaryResDto(
                activeWaitings.size(),
                Math.toIntExact(activeWaitings.stream().filter(waiting -> waiting.getStatus() == WaitingStatus.WAITING).count()),
                frontQueue.size(),
                inUse.size(),
                blockedByOtherBoothCount
        );

        return BoothManagerConverter.toDashboardResDto(booth, summary, frontQueue, inUse);
    }

    public WaitingCallResDto callNextWaiting(final Long boothId) {
        return waitingService.callNextWaiting(boothId);
    }

    public WaitingAdmitResDto admitWaiting(final Long boothId, final Long waitingId) {
        return waitingService.admitWaiting(waitingId, boothId);
    }

    public void cancelWaiting(final Long boothId, final Long waitingId) {
        waitingService.cancelWaitingByAdmin(waitingId, boothId);
    }

    private Booth getBoothEntity(final Long boothId) {
        return boothRepository.findById(boothId)
                .orElseThrow(() -> new BoothException(ErrorCode.BOOTH_NOT_FOUND));
    }
}
