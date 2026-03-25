package com.freeline.domain.waiting.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.waiting.dto.message.WaitingExpireTaskMessage;

@Slf4j
@Component
@RequiredArgsConstructor
public class WaitingExpireTaskScheduler {

    private final WaitingExpireDelayPublisher waitingExpireDelayPublisher;
    private final BoothWaitingRepository boothWaitingRepository;
    private final WaitingPolicyResolver waitingPolicyResolver;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(final WaitingEventMessage message) {
        if (message.eventType() != WaitingEventType.WAITING_CALLED || message.waitingId() == null) {
            return;
        }

        final BoothWaiting waiting = boothWaitingRepository.findById(message.waitingId())
                .orElseGet(() -> {
                    log.warn(
                            "[Waiting] expire task scheduling skipped because waiting was not found {eventId: {}, waitingId: {}}",
                            message.eventId(),
                            message.waitingId()
                    );
                    return null;
                });
        if (waiting == null || waiting.getStatus() != WaitingStatus.CALLED) {
            return;
        }

        final LocalDateTime expiresAt = resolveCallExpiresAt(waiting);
        if (expiresAt == null) {
            log.warn(
                    "[Waiting] expire task scheduling skipped due to missing expiresAt {eventId: {}, waitingId: {}}",
                    message.eventId(),
                    message.waitingId()
            );
            return;
        }

        final Duration delay = Duration.between(TimeUtils.nowDateTime(), expiresAt);
        if (delay.isNegative() || delay.isZero()) {
            return;
        }

        waitingExpireDelayPublisher.publish(
                WaitingExpireTaskMessage.builder()
                        .eventId(resolveTaskEventId(message))
                        .waitingId(waiting.getId())
                        .expiresAt(expiresAt)
                        .build(),
                delay
        );
    }

    private LocalDateTime resolveCallExpiresAt(final BoothWaiting waiting) {
        if (waiting.getCallExpiresAt() != null) {
            return waiting.getCallExpiresAt();
        }

        if (waiting.getCalledAt() == null) {
            return null;
        }

        final int callValidSeconds = waitingPolicyResolver.resolveCallValidTimeSeconds(waiting.getBoothId(), 180);
        return waiting.getCalledAt().plusSeconds(callValidSeconds);
    }

    private UUID resolveTaskEventId(final WaitingEventMessage message) {
        if (message.eventId() != null) {
            return message.eventId();
        }

        return UUID.randomUUID();
    }
}
