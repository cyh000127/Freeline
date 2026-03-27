package com.freeline.domain.waiting.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.event.waiting.detector.WaitingStatusChangeCommand;
import com.freeline.common.event.waiting.dispatcher.WaitingEventDispatcher;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.VisitorQueueStatus;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventStatus;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventRepository;
import com.freeline.domain.waiting.assembler.WaitingEventSnapshotAssembler;
import com.freeline.domain.waiting.converter.WaitingConverter;
import com.freeline.domain.waiting.dto.response.VisitorWaitingListResDto;
import com.freeline.domain.waiting.dto.response.VisitorWaitingResDto;
import com.freeline.domain.waiting.dto.response.WaitingAdmitResDto;
import com.freeline.domain.waiting.dto.response.WaitingCallResDto;
import com.freeline.domain.waiting.dto.response.WaitingCreateResDto;
import com.freeline.domain.waiting.dto.response.WaitingDashboardResDto;
import com.freeline.domain.waiting.dto.response.WaitingExitResDto;
import com.freeline.domain.waiting.dto.response.WaitingExpectedTimeResDto;
import com.freeline.domain.waiting.dto.response.WaitingPostponeResDto;
import com.freeline.domain.waiting.dto.response.WaitingQueueItemDto;
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

    private static final List<WaitingStatus> BOOTH_WAITING_CAPACITY_STATUSES = List.of(
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED
    );

    private static final List<WaitingStatus> OTHER_BOOTH_FRONT_QUEUE_STATUSES = List.of(
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED,
            WaitingStatus.ENTERED
    );

    private static final List<WaitingStatus> RANKED_WAITING_STATUSES = List.of(
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED
    );

    private static final List<WaitingStatus> CANCEL_BLOCKED_STATUSES = List.of(
            WaitingStatus.ENTERED,
            WaitingStatus.EXITED,
            WaitingStatus.EXPIRED,
            WaitingStatus.CANCELED
    );

    private static final List<WaitingStatus> ADMIN_CANCEL_BLOCKED_STATUSES = List.of(
            WaitingStatus.ENTERED,
            WaitingStatus.EXITED,
            WaitingStatus.CANCELED
    );

    private static final int MAX_ACTIVE_WAITING_COUNT = 3;
    private static final int DEFAULT_CALL_COUNT = 1;
    private static final int DEFAULT_CALL_VALID_TIME_SECONDS = 180;
    private static final int DEFAULT_DEFER_LIMIT = 0;
    private static final int DEFAULT_MAX_WAITING_COUNT = Integer.MAX_VALUE;
    private static final int DEFAULT_STAY_TIME_SECONDS = 0;
    private static final int SECONDS_PER_MINUTE = 60;

    private final BoothRepository boothRepository;
    private final BoothWaitingRepository boothWaitingRepository;
    private final EventRepository eventRepository;
    private final WaitingEventDispatcher waitingEventDispatcher;
    private final WaitingEventSnapshotAssembler waitingEventSnapshotAssembler;
    private final WaitingPolicyResolver waitingPolicyResolver;

    public WaitingCreateResDto createWaiting(final Long boothId, final Long visitorId) {
        validateEventIsOpen(getBoothEntity(boothId));
        validateDuplicateWaitingAtBooth(boothId, visitorId);
        validateActiveWaitingCount(visitorId);
        validateBoothWaitingCapacity(boothId);

        final int nextWaitingNumber = boothWaitingRepository.findTopByBoothIdOrderByWaitingNumberDesc(boothId)
                .map(BoothWaiting::getWaitingNumber)
                .map(number -> number + 1)
                .orElse(1);

        final BoothWaiting saved = boothWaitingRepository.save(
                WaitingConverter.toEntity(boothId, visitorId, nextWaitingNumber, TimeUtils.nowDateTime())
        );
        dispatchStatusChanged(saved, "NONE", WaitingEventType.WAITING_CREATED);
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

    public WaitingCallResDto callNextWaiting(final Long boothId) {
        validateEventIsOpen(getBoothEntity(boothId));
        final int remainingCallSlots = resolveRemainingCallSlots(boothId);
        if (remainingCallSlots <= 0) {
            throw new WaitingException(ErrorCode.FRONT_QUEUE_FULL);
        }

        final List<BoothWaiting> calledWaitings = boothWaitingRepository.findAllByBoothIdAndStatusInOrderByWaitingNumberAsc(
                        boothId,
                        List.of(WaitingStatus.WAITING)
                )
                .stream()
                .filter(candidate -> !boothWaitingRepository.existsByVisitorIdAndBoothIdNotAndStatusIn(
                        candidate.getVisitorId(),
                        boothId,
                        OTHER_BOOTH_FRONT_QUEUE_STATUSES
                ))
                .limit(remainingCallSlots)
                .toList();

        if (calledWaitings.isEmpty()) {
            throw new WaitingException(ErrorCode.CALL_CANDIDATE_NOT_FOUND);
        }

        final int callValidTimeSeconds = resolveCallValidTimeSeconds(boothId);
        final LocalDateTime calledAt = TimeUtils.nowDateTime();
        final LocalDateTime callExpiresAt = calledAt.plusSeconds(callValidTimeSeconds);

        calledWaitings.forEach(waiting -> {
            final String previousStatus = waiting.getStatus().name();
            waiting.updateStatus(WaitingStatus.CALLED);
            waiting.updateCalledAt(calledAt);
            waiting.updateCallExpiresAt(callExpiresAt);
            dispatchStatusChanged(waiting, previousStatus, WaitingEventType.WAITING_CALLED);
        });

        log.info(
                "[Waiting] call complete {boothId: {}, callCount: {}, waitingIds: {}}",
                boothId,
                calledWaitings.size(),
                calledWaitings.stream()
                        .map(BoothWaiting::getId)
                        .toList()
        );

        return WaitingConverter.toWaitingCallResDto(calledWaitings);
    }

    public void cancelWaiting(final Long waitingId, final Long visitorId) {
        final BoothWaiting waiting = getWaitingEntity(waitingId);
        validateWaitingOwner(waiting, visitorId);

        if (CANCEL_BLOCKED_STATUSES.contains(waiting.getStatus())) {
            throw new WaitingException(ErrorCode.INVALID_WAITING_STATUS_FOR_CANCEL);
        }

        final String previousStatus = waiting.getStatus().name();
        waiting.updateStatus(WaitingStatus.CANCELED);
        waiting.updateExitedAt(TimeUtils.nowDateTime());
        dispatchStatusChanged(waiting, previousStatus, WaitingEventType.WAITING_CANCELED);

        log.info(
                "[Waiting] cancel complete {waitingId: {}, boothId: {}, visitorId: {}}",
                waiting.getId(),
                waiting.getBoothId(),
                visitorId
        );
    }

    public WaitingPostponeResDto postponeWaiting(final Long waitingId, final Long visitorId) {
        final BoothWaiting waiting = getWaitingEntity(waitingId);
        validateWaitingOwner(waiting, visitorId);
        validatePostponeStatus(waiting);

        final int deferLimit = resolveDeferLimit(waiting.getBoothId());
        if (waiting.getDeferCount() >= deferLimit) {
            throw new WaitingException(ErrorCode.POSTPONE_LIMIT_EXCEEDED);
        }

        final BoothWaiting nextWaiting = boothWaitingRepository
                .findFirstByBoothIdAndStatusAndWaitingNumberGreaterThanOrderByWaitingNumberAsc(
                        waiting.getBoothId(),
                        WaitingStatus.WAITING,
                        waiting.getWaitingNumber()
                )
                .orElseThrow(() -> new WaitingException(ErrorCode.CANNOT_POSTPONE_LAST_IN_LINE));

        swapWaitingNumbers(waiting, nextWaiting);
        waiting.increaseDeferCount();

        log.info(
                "[Waiting] postpone complete {waitingId: {}, boothId: {}, visitorId: {}, newWaitingNumber: {}, deferCount: {}}",
                waiting.getId(),
                waiting.getBoothId(),
                visitorId,
                waiting.getWaitingNumber(),
                waiting.getDeferCount()
        );

        return WaitingConverter.toWaitingPostponeResDto(
                waiting,
                resolveMyRank(waiting),
                deferLimit - waiting.getDeferCount()
        );
    }

    public WaitingExitResDto exitWaiting(final Long waitingId, final Long visitorId) {
        final BoothWaiting waiting = getWaitingEntity(waitingId);
        validateWaitingOwner(waiting, visitorId);
        return exitWaitingInternal(waiting);
    }

    public WaitingExitResDto exitWaitingByAdmin(final Long waitingId, final Long boothId) {
        final BoothWaiting waiting = getWaitingEntity(waitingId);
        validateWaitingBooth(waiting, boothId);
        validateEventIsOpen(getBoothEntity(boothId));
        return exitWaitingInternal(waiting);
    }

    public WaitingAdmitResDto admitWaiting(final Long waitingId, final Long boothId) {
        final BoothWaiting waiting = getWaitingEntity(waitingId);
        validateWaitingBooth(waiting, boothId);
        validateEventIsOpen(getBoothEntity(boothId));
        if (waiting.getStatus() != WaitingStatus.REGISTERED) {
            throw new WaitingException(ErrorCode.INVALID_STATUS_FOR_ADMIT);
        }

        final String previousStatus = waiting.getStatus().name();
        waiting.updateStatus(WaitingStatus.ENTERED);
        waiting.updateEnteredAt(TimeUtils.nowDateTime());
        dispatchStatusChanged(waiting, previousStatus, WaitingEventType.WAITING_ENTERED);

        log.info(
                "[Waiting] admit complete {waitingId: {}, boothId: {}, visitorId: {}}",
                waiting.getId(),
                boothId,
                waiting.getVisitorId()
        );

        return WaitingConverter.toWaitingAdmitResDto(waiting);
    }

    @Transactional(readOnly = true)
    public WaitingDashboardResDto getBoothQueueDashboard(final Long boothId) {
        validateEventIsOpen(getBoothEntity(boothId));

        final List<WaitingQueueItemDto> queueList = boothWaitingRepository
                .findWithVisitorByBoothIdAndStatusInOrderByWaitingNumberAsc(boothId, ACTIVE_WAITING_STATUSES)
                .stream()
                .map(WaitingConverter::toWaitingQueueItemDto)
                .toList();

        return WaitingConverter.toWaitingDashboardResDto(boothId, queueList);
    }

    public void cancelWaitingByAdmin(final Long waitingId, final Long boothId) {
        final BoothWaiting waiting = getWaitingEntity(waitingId);
        validateWaitingBooth(waiting, boothId);
        validateEventIsOpen(getBoothEntity(boothId));
        if (ADMIN_CANCEL_BLOCKED_STATUSES.contains(waiting.getStatus())) {
            throw new WaitingException(ErrorCode.INVALID_WAITING_STATUS_FOR_CANCEL);
        }

        final String previousStatus = waiting.getStatus().name();
        waiting.updateStatus(WaitingStatus.CANCELED);
        waiting.updateExitedAt(TimeUtils.nowDateTime());
        dispatchStatusChanged(waiting, previousStatus, WaitingEventType.WAITING_CANCELED);

        log.info(
                "[Waiting] admin cancel complete {waitingId: {}, boothId: {}, visitorId: {}}",
                waiting.getId(),
                boothId,
                waiting.getVisitorId()
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
        validateEventIsOpen(getBoothEntity(boothId));

        final int currentRank = Math.toIntExact(boothWaitingRepository.countByBoothIdAndStatusIn(
                boothId,
                ACTIVE_WAITING_STATUSES
        ));
        final int stayTimeSeconds = waitingPolicyResolver.resolveStayTimeSeconds(boothId, DEFAULT_STAY_TIME_SECONDS);
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

    private void validateBoothWaitingCapacity(final Long boothId) {
        final int maxWaitingCount = waitingPolicyResolver.resolveMaxWaitingCount(boothId, DEFAULT_MAX_WAITING_COUNT);
        final long currentWaitingCount = boothWaitingRepository.countByBoothIdAndStatusIn(
                boothId,
                BOOTH_WAITING_CAPACITY_STATUSES
        );
        if (currentWaitingCount >= maxWaitingCount) {
            throw new WaitingException(ErrorCode.BOOTH_MAX_WAITING_EXCEEDED);
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
        if (waiting.getStatus() != WaitingStatus.WAITING) {
            return false;
        }

        return waiting.getDeferCount() < resolveDeferLimit(waiting.getBoothId());
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

    private void validateEventIsOpen(final Booth booth) {
        final Event event = eventRepository.findById(booth.getEventId())
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_NOT_FOUND));

        if (event.getStatus() != EventStatus.OPEN) {
            throw new EventException(ErrorCode.EVENT_NOT_OPEN_FOR_WAITING_OPERATION);
        }
    }

    private BoothWaiting getWaitingEntity(final Long waitingId) {
        return boothWaitingRepository.findById(waitingId)
                .orElseThrow(() -> new WaitingException(ErrorCode.NOT_FOUND));
    }

    private void validateWaitingOwner(final BoothWaiting waiting, final Long visitorId) {
        if (!waiting.getVisitorId().equals(visitorId)) {
            throw new WaitingException(ErrorCode.WAITING_ACCESS_DENIED);
        }
    }

    private void validateWaitingBooth(final BoothWaiting waiting, final Long boothId) {
        if (!waiting.getBoothId().equals(boothId)) {
            throw new WaitingException(ErrorCode.ACCESS_DENIED);
        }
    }

    private void validatePostponeStatus(final BoothWaiting waiting) {
        if (waiting.getStatus() != WaitingStatus.WAITING) {
            throw new WaitingException(ErrorCode.INVALID_WAITING_STATUS_FOR_POSTPONE);
        }
    }

    private int resolveDeferLimit(final Long boothId) {
        return waitingPolicyResolver.resolveDeferLimit(boothId, DEFAULT_DEFER_LIMIT);
    }

    private int resolveCallValidTimeSeconds(final Long boothId) {
        return waitingPolicyResolver.resolveCallValidTimeSeconds(boothId, DEFAULT_CALL_VALID_TIME_SECONDS);
    }

    private int resolveRemainingCallSlots(final Long boothId) {
        final int callCount = waitingPolicyResolver.resolveCallCount(boothId, DEFAULT_CALL_COUNT);
        final long currentFrontQueueCount = boothWaitingRepository.countByBoothIdAndStatusIn(
                boothId,
                FRONT_QUEUE_STATUSES
        );
        return Math.max(callCount - Math.toIntExact(currentFrontQueueCount), 0);
    }

    private void swapWaitingNumbers(final BoothWaiting source, final BoothWaiting target) {
        final int sourceWaitingNumber = source.getWaitingNumber();
        source.updateWaitingNumber(target.getWaitingNumber());
        target.updateWaitingNumber(sourceWaitingNumber);
    }

    private void dispatchStatusChanged(
            final BoothWaiting waiting,
            final String previousStatus,
            final WaitingEventType eventType
    ) {
        waitingEventDispatcher.dispatch(
                new WaitingStatusChangeCommand(
                        eventType,
                        waiting.getId(),
                        waiting.getBoothId(),
                        waiting.getVisitorId(),
                        previousStatus,
                        waiting.getStatus().name(),
                        waitingEventSnapshotAssembler.toSnapshot(waiting)
                )
        );
    }

    private WaitingExitResDto exitWaitingInternal(final BoothWaiting waiting) {
        if (waiting.getStatus() != WaitingStatus.ENTERED) {
            throw new WaitingException(ErrorCode.INVALID_WAITING_STATUS_FOR_EXIT);
        }

        final String previousStatus = waiting.getStatus().name();
        waiting.updateStatus(WaitingStatus.EXITED);
        waiting.updateExitedAt(TimeUtils.nowDateTime());
        dispatchStatusChanged(waiting, previousStatus, WaitingEventType.WAITING_EXITED);

        log.info(
                "[Waiting] exit complete {waitingId: {}, boothId: {}, visitorId: {}}",
                waiting.getId(),
                waiting.getBoothId(),
                waiting.getVisitorId()
        );

        return WaitingConverter.toWaitingExitResDto(waiting);
    }
}
