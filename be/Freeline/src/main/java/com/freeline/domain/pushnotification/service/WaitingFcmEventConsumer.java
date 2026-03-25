package com.freeline.domain.pushnotification.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.pushnotification.dto.message.WaitingFcmTaskMessage;
import com.freeline.domain.pushnotification.dto.request.PushNotificationSendReqDto;
import com.freeline.domain.pushnotification.entity.PushNotificationType;
import com.freeline.domain.pushnotification.exception.PushNotificationException;
import com.freeline.domain.waiting.service.WaitingPolicyResolver;

@Slf4j
@Component
@RequiredArgsConstructor
public class WaitingFcmEventConsumer {

    private final PushNotificationService pushNotificationService;
    private final WaitingFcmDelayPublisher waitingFcmDelayPublisher;
    private final BoothWaitingRepository boothWaitingRepository;
    private final WaitingPolicyResolver waitingPolicyResolver;

    @RabbitListener(
            queues = "${app.rabbitmq.waiting.fcm-queue:waiting.fcm.queue}",
            containerFactory = "waitingRabbitListenerContainerFactory"
    )
    public void consume(final WaitingEventMessage message) {
        if (!message.eventType().isFcmTarget() || message.waitingId() == null) {
            return;
        }

        if (!pushNotificationService.isConfigured()) {
            log.info(
                    "[PushNotification] FCM consumer skipped because push sender is not configured {eventId: {}, eventType: {}}",
                    message.eventId(),
                    message.eventType()
            );
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
        final BoothWaiting waiting = findWaitingOrSkip(message.waitingId(), message.eventId(), message.eventType());
        if (waiting == null) {
            return;
        }

        final NotificationDispatchResult dispatchResult = sendNotificationOrSkip(
                message.waitingId(),
                PushNotificationType.FRONT_QUEUE_CALLED,
                message.eventId()
        );
        if (!shouldScheduleCalledReminder(dispatchResult)) {
            return;
        }

        final Duration reminderDelay = resolveCallReminderDelay(waiting);
        if (reminderDelay.isNegative() || reminderDelay.isZero()) {
            return;
        }

        waitingFcmDelayPublisher.publish(
                WaitingFcmTaskMessage.builder()
                        .eventId(resolveTaskEventId(message))
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
        final BoothWaiting waiting = findWaitingOrSkip(message.waitingId(), message.eventId(), message.eventType());
        if (waiting == null) {
            return;
        }

        final Duration exitReminderDelay = resolveExitReminderDelay(waiting);
        if (exitReminderDelay.isNegative() || exitReminderDelay.isZero()) {
            return;
        }

        waitingFcmDelayPublisher.publish(
                WaitingFcmTaskMessage.builder()
                        .eventId(resolveTaskEventId(message))
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
        sendNotificationOrSkip(message.waitingId(), PushNotificationType.WAITING_EXPIRED, message.eventId());
    }

    private BoothWaiting findWaitingOrSkip(
            final Long waitingId,
            final UUID eventId,
            final WaitingEventType eventType
    ) {
        return boothWaitingRepository.findById(waitingId)
                .orElseGet(() -> {
                    log.warn(
                            "[PushNotification] FCM consumer skipped because waiting was not found {eventId: {}, eventType: {}, waitingId: {}}",
                            eventId,
                            eventType,
                            waitingId
                    );
                    return null;
                });
    }

    private NotificationDispatchResult sendNotificationOrSkip(
            final Long waitingId,
            final PushNotificationType notificationType,
            final UUID eventId
    ) {
        try {
            pushNotificationService.sendNotification(
                    waitingId,
                    PushNotificationSendReqDto.builder()
                            .notificationType(notificationType)
                            .customMessage("")
                            .build()
            );
            return NotificationDispatchResult.SENT;
        } catch (final PushNotificationException ex) {
            final NotificationDispatchResult dispatchResult = resolveDispatchResult(ex.getErrorCode());
            if (dispatchResult != null) {
                log.warn(
                        "[PushNotification] FCM consumer skipped {eventId: {}, waitingId: {}, notificationType: {}, reason: {}}",
                        eventId,
                        waitingId,
                        notificationType,
                        ex.getErrorCode()
                );
                return dispatchResult;
            }

            throw ex;
        }
    }

    private NotificationDispatchResult resolveDispatchResult(final ErrorCode errorCode) {
        if (errorCode == ErrorCode.PUSH_NOTIFICATION_TOKEN_NOT_FOUND) {
            return NotificationDispatchResult.TOKEN_NOT_FOUND;
        }

        if (errorCode == ErrorCode.NOT_FOUND
                || errorCode == ErrorCode.PUSH_NOTIFICATION_NOT_CONFIGURED
                || errorCode == ErrorCode.PUSH_NOTIFICATION_WAITING_STATUS_MISMATCH
                || errorCode == ErrorCode.INVALID_INPUT) {
            return NotificationDispatchResult.STOP_DELAYED_TASK;
        }

        return null;
    }

    private boolean shouldScheduleCalledReminder(final NotificationDispatchResult dispatchResult) {
        return dispatchResult == NotificationDispatchResult.SENT
                || dispatchResult == NotificationDispatchResult.TOKEN_NOT_FOUND;
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

        final int callValidTime = waitingPolicyResolver.resolveCallValidTimeSeconds(waiting.getBoothId(), 180);

        return waiting.getCalledAt().plusSeconds(callValidTime);
    }

    private Duration resolveExitReminderDelay(final BoothWaiting waiting) {
        if (waiting.getEnteredAt() == null) {
            return Duration.ZERO;
        }

        final int stayTimeSeconds = waitingPolicyResolver.resolveStayTimeSeconds(waiting.getBoothId(), 0);

        if (stayTimeSeconds <= 0) {
            return Duration.ZERO;
        }

        final LocalDateTime reminderAt = waiting.getEnteredAt().plusSeconds(stayTimeSeconds);
        return Duration.between(TimeUtils.nowDateTime(), reminderAt);
    }

    private UUID resolveTaskEventId(final WaitingEventMessage message) {
        if (message.eventId() != null) {
            return message.eventId();
        }

        return UUID.randomUUID();
    }

    private enum NotificationDispatchResult {
        SENT,
        TOKEN_NOT_FOUND,
        STOP_DELAYED_TASK
    }
}
