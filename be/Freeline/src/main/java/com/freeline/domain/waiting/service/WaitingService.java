package com.freeline.domain.waiting.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.VisitorQueueStatus;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.waiting.converter.WaitingConverter;
import com.freeline.domain.waiting.dto.response.VisitorWaitingListResDto;
import com.freeline.domain.waiting.dto.response.VisitorWaitingResDto;
import com.freeline.domain.waiting.dto.response.WaitingCreateResDto;
import com.freeline.domain.waiting.dto.response.WaitingExpectedTimeResDto;
import com.freeline.domain.waiting.exception.WaitingException;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class WaitingService {

    private static final List<WaitingStatus> ACTIVE_WAITING_STATUSES = List.of(
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED,
            WaitingStatus.ENTERED
    );

    private static final List<WaitingStatus> FRONT_QUEUE_STATUSES = List.of(
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED
    );

    private static final List<WaitingStatus> RANKED_WAITING_STATUSES = List.of(
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED
    );

    private static final int MAX_ACTIVE_WAITING_COUNT = 3;
    private static final int DEFAULT_DEFER_LIMIT = 0;
    private static final int DEFAULT_STAY_TIME_SECONDS = 0;
    private static final int SECONDS_PER_MINUTE = 60;

    private final BoothRepository boothRepository;
    private final BoothWaitingRepository boothWaitingRepository;
    private final BoothPolicyRepository boothPolicyRepository;

    public WaitingCreateResDto createWaiting(final Long boothId, final Long visitorId) {
        getBoothEntity(boothId);
        validateDuplicateWaitingAtBooth(boothId, visitorId);
        validateActiveWaitingCount(visitorId);

        final int nextWaitingNumber = boothWaitingRepository.findTopByBoothIdOrderByWaitingNumberDesc(boothId)
                .map(BoothWaiting::getWaitingNumber)
                .map(number -> number + 1)
                .orElse(1);

        final BoothWaiting saved = boothWaitingRepository.save(
                WaitingConverter.toEntity(boothId, visitorId, nextWaitingNumber, TimeUtils.nowDateTime())
        );
        final List<BoothWaiting> activeWaitings = boothWaitingRepository
                .findAllByVisitorIdAndStatusInOrderByRequestedAtAsc(visitorId, ACTIVE_WAITING_STATUSES);

        log.info(
                "[Waiting] 대기 등록 완료 {waitingId: {}, boothId: {}, visitorId: {}, waitingNumber: {}}",
                saved.getId(),
                boothId,
                visitorId,
                saved.getWaitingNumber()
        );

        return WaitingConverter.toWaitingCreateResDto(
                saved,
                resolveMyRank(saved),
                resolveVisitorQueueStatus(activeWaitings)
        );
    }

    @Transactional(readOnly = true)
    public VisitorWaitingListResDto getMyWaitings(final Long visitorId) {
        final List<BoothWaiting> activeWaitings = boothWaitingRepository
                .findAllByVisitorIdAndStatusInOrderByRequestedAtAsc(visitorId, ACTIVE_WAITING_STATUSES);

        final List<VisitorWaitingResDto> waitings = activeWaitings.stream()
                .map(waiting -> WaitingConverter.toVisitorWaitingResDto(
                        waiting,
                        resolveMyRank(waiting),
                        isPostponeAvailable(waiting)
                ))
                .toList();

        return WaitingConverter.toVisitorWaitingListResDto(resolveVisitorQueueStatus(activeWaitings), waitings);
    }

    @Transactional(readOnly = true)
    public WaitingExpectedTimeResDto getExpectedWaitingTime(final Long boothId) {
        getBoothEntity(boothId);

        final int currentRank = Math.toIntExact(boothWaitingRepository.countByBoothIdAndStatus(boothId, WaitingStatus.WAITING));
        final int stayTimeSeconds = boothPolicyRepository.findByBoothId(boothId)
                .map(BoothPolicy::getStayTime)
                .filter(value -> value != null && value > 0)
                .orElse(DEFAULT_STAY_TIME_SECONDS);
        final int avgStayTimeMinutes = stayTimeSeconds > 0
                ? Math.toIntExact(Math.ceilDiv((long) stayTimeSeconds, SECONDS_PER_MINUTE))
                : 0;
        final int estimatedMinutes = stayTimeSeconds > 0
                ? Math.toIntExact(Math.ceilDiv((long) currentRank * stayTimeSeconds, SECONDS_PER_MINUTE))
                : 0;

        return WaitingConverter.toWaitingExpectedTimeResDto(
                boothId,
                currentRank,
                estimatedMinutes,
                avgStayTimeMinutes
        );
    }

    private void validateActiveWaitingCount(final Long visitorId) {
        final long activeWaitingCount = boothWaitingRepository.countByVisitorIdAndStatusIn(visitorId, ACTIVE_WAITING_STATUSES);
        if (activeWaitingCount >= MAX_ACTIVE_WAITING_COUNT) {
            throw new WaitingException(ErrorCode.MAX_WAITING_EXCEEDED);
        }
    }

    private void validateDuplicateWaitingAtBooth(final Long boothId, final Long visitorId) {
        final boolean alreadyWaitingAtBooth = boothWaitingRepository.existsByVisitorIdAndBoothIdAndStatusIn(
                visitorId,
                boothId,
                ACTIVE_WAITING_STATUSES
        );
        if (alreadyWaitingAtBooth) {
            throw new WaitingException(ErrorCode.ALREADY_WAITING_FOR_BOOTH);
        }
    }

    private int resolveMyRank(final BoothWaiting waiting) {
        if (!RANKED_WAITING_STATUSES.contains(waiting.getStatus())) {
            return 0;
        }

        return Math.toIntExact(boothWaitingRepository.countByBoothIdAndStatusInAndWaitingNumberLessThan(
                waiting.getBoothId(),
                RANKED_WAITING_STATUSES,
                waiting.getWaitingNumber()
        )) + 1;
    }

    private boolean isPostponeAvailable(final BoothWaiting waiting) {
        if (waiting.getStatus() != WaitingStatus.CALLED) {
            return false;
        }

        final int deferLimit = boothPolicyRepository.findByBoothId(waiting.getBoothId())
                .map(BoothPolicy::getDeferLimit)
                .filter(value -> value != null && value >= 0)
                .orElse(DEFAULT_DEFER_LIMIT);

        return waiting.getDeferCount() < deferLimit;
    }

    private VisitorQueueStatus resolveVisitorQueueStatus(final List<BoothWaiting> activeWaitings) {
        if (activeWaitings.stream().anyMatch(waiting -> waiting.getStatus() == WaitingStatus.ENTERED)) {
            return VisitorQueueStatus.IN_BOOTH;
        }

        if (activeWaitings.stream().anyMatch(waiting -> FRONT_QUEUE_STATUSES.contains(waiting.getStatus()))) {
            return VisitorQueueStatus.FRONT_QUEUE_OCCUPIED;
        }

        return VisitorQueueStatus.FREE;
    }

    private Booth getBoothEntity(final Long boothId) {
        return boothRepository.findById(boothId)
                .orElseThrow(() -> new BoothException(ErrorCode.BOOTH_NOT_FOUND));
    }
}
