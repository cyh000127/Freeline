package com.freeline.domain.pushnotification.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.pushnotification.dto.message.WaitingFcmTaskMessage;
import com.freeline.domain.pushnotification.dto.request.PushNotificationSendReqDto;
import com.freeline.domain.pushnotification.entity.PushNotificationType;

@Slf4j
@Component
@RequiredArgsConstructor
public class WaitingFcmEventConsumer {

    private final PushNotificationService pushNotificationService;
    private final WaitingFcmDelayPublisher waitingFcmDelayPublisher;
    private final BoothWaitingRepository boothWaitingRepository;
    private final BoothPolicyRepository boothPolicyRepository;

    @RabbitListener(
            queues = "${app.rabbitmq.waiting.fcm-queue:waiting.fcm.queue}",
            containerFactory = "waitingRabbitListenerContainerFactory"
    )
    public void consume(final WaitingEventMessage message) {
        if (!message.eventType().isFcmTarget() || message.waitingId() == null) {
            return;
        }

        switch (message.eventType()) {
            case WAITING_CALLED -> handleCalled(message);
            case WAITING_ENTERED -> handleEntered(message);
            case WAITING_EXPIRED -> handleExpired(message);
            default -> log.debug(
                    "[PushNotification] waiting event ignored by fcm consumer {eventId: {}, eventType: {}}",
                    message.eventId(),
                    message.eventType()
            );
        }
    }

    private void handleCalled(final WaitingEventMessage message) {
        pushNotificationService.sendNotification(
                message.waitingId(),
                PushNotificationSendReqDto.builder()
                        .notificationType(PushNotificationType.FRONT_QUEUE_CALLED)
                        .customMessage("")
                        .build()
        );

        final BoothWaiting waiting = getWaiting(message.waitingId());
        final Duration reminderDelay = resolveCallReminderDelay(waiting);
        if (reminderDelay.isNegative() || reminderDelay.isZero()) {
            return;
        }

        waitingFcmDelayPublisher.publish(
                WaitingFcmTaskMessage.builder()
                        .eventId(UUID.randomUUID())
                        .waitingId(waiting.getId())
                        .boothId(waiting.getBoothId())
                        .visitorId(waiting.getVisitorId())
                        .expectedStatus(WaitingStatus.CALLED.name())
                        .notificationType(PushNotificationType.QR_CHECK_REMINDER)
                        .build(),
                reminderDelay
        );
    }

    private void handleEntered(final WaitingEventMessage message) {
        final BoothWaiting waiting = getWaiting(message.waitingId());
        final Duration exitReminderDelay = resolveExitReminderDelay(waiting);
        if (exitReminderDelay.isNegative() || exitReminderDelay.isZero()) {
            return;
        }

        waitingFcmDelayPublisher.publish(
                WaitingFcmTaskMessage.builder()
                        .eventId(UUID.randomUUID())
                        .waitingId(waiting.getId())
                        .boothId(waiting.getBoothId())
                        .visitorId(waiting.getVisitorId())
                        .expectedStatus(WaitingStatus.ENTERED.name())
                        .notificationType(PushNotificationType.EXIT_ACTION_REQUIRED)
                        .build(),
                exitReminderDelay
        );
    }

    private void handleExpired(final WaitingEventMessage message) {
        pushNotificationService.sendNotification(
                message.waitingId(),
                PushNotificationSendReqDto.builder()
                        .notificationType(PushNotificationType.WAITING_EXPIRED)
                        .customMessage("")
                        .build()
        );
    }

    private BoothWaiting getWaiting(final Long waitingId) {
        return boothWaitingRepository.findById(waitingId)
                .orElseThrow(() -> new IllegalStateException("FCM consumer waiting not found: " + waitingId));
    }

    private Duration resolveCallReminderDelay(final BoothWaiting waiting) {
        if (waiting.getCalledAt() == null) {
            return Duration.ZERO;
        }

        final LocalDateTime expiresAt = resolveCallExpiresAt(waiting);
        if (expiresAt == null || !expiresAt.isAfter(waiting.getCalledAt())) {
            return Duration.ZERO;
        }

        final long halfSeconds = Duration.between(waiting.getCalledAt(), expiresAt).toSeconds() / 2;
        final LocalDateTime reminderAt = waiting.getCalledAt().plusSeconds(halfSeconds);
        return Duration.between(TimeUtils.nowDateTime(), reminderAt);
    }

    private LocalDateTime resolveCallExpiresAt(final BoothWaiting waiting) {
        if (waiting.getCallExpiresAt() != null) {
            return waiting.getCallExpiresAt();
        }

        if (waiting.getCalledAt() == null) {
            return null;
        }

        final int callValidTime = boothPolicyRepository.findByBoothId(waiting.getBoothId())
                .map(BoothPolicy::getCallValidTime)
                .filter(value -> value > 0)
                .orElse(180);

        return waiting.getCalledAt().plusSeconds(callValidTime);
    }

    private Duration resolveExitReminderDelay(final BoothWaiting waiting) {
        if (waiting.getEnteredAt() == null) {
            return Duration.ZERO;
        }

        final int stayTimeSeconds = boothPolicyRepository.findByBoothId(waiting.getBoothId())
                .map(BoothPolicy::getStayTime)
                .filter(value -> value > 0)
                .orElse(0);

        if (stayTimeSeconds <= 0) {
            return Duration.ZERO;
        }

        final LocalDateTime reminderAt = waiting.getEnteredAt().plusSeconds(stayTimeSeconds);
        return Duration.between(TimeUtils.nowDateTime(), reminderAt);
    }
}
