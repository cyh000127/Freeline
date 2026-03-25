package com.freeline.domain.pushnotification.service;

import java.time.LocalDateTime;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.pushnotification.dto.message.WaitingFcmTaskMessage;
import com.freeline.domain.pushnotification.dto.request.PushNotificationSendReqDto;
import com.freeline.domain.pushnotification.entity.PushNotificationType;
import com.freeline.domain.pushnotification.exception.PushNotificationException;

@Slf4j
@Component
@RequiredArgsConstructor
public class WaitingFcmDelayedConsumer {

    private final PushNotificationService pushNotificationService;

    @RabbitListener(
            queues = "${app.rabbitmq.waiting.fcm-delayed-queue:waiting.fcm.delayed.queue}",
            containerFactory = "waitingRabbitListenerContainerFactory"
    )
    public void consume(final WaitingFcmTaskMessage message) {
        if (message.waitingId() == null || message.notificationType() == null) {
            log.warn(
                    "[PushNotification] delayed task skipped due to missing payload {eventId: {}, waitingId: {}, notificationType: {}}",
                    message.eventId(),
                    message.waitingId(),
                    message.notificationType()
            );
            return;
        }

        if (!pushNotificationService.isConfigured()) {
            log.info(
                    "[PushNotification] delayed task skipped because push sender is not configured {eventId: {}, waitingId: {}, notificationType: {}}",
                    message.eventId(),
                    message.waitingId(),
                    message.notificationType()
            );
            return;
        }

        if (isQrReminder(message)) {
            final LocalDateTime validUntil = message.validUntil();
            if (validUntil == null) {
                log.warn(
                        "[PushNotification] delayed task skipped due to missing validUntil {eventId: {}, waitingId: {}, notificationType: {}}",
                        message.eventId(),
                        message.waitingId(),
                        message.notificationType()
                );
                return;
            }

            if (TimeUtils.nowDateTime().isAfter(validUntil)) {
                log.warn(
                        "[PushNotification] delayed task skipped because validUntil has expired {eventId: {}, waitingId: {}, validUntil: {}, notificationType: {}}",
                        message.eventId(),
                        message.waitingId(),
                        validUntil,
                        message.notificationType()
                );
                return;
            }
        }

        if (StringUtils.hasText(message.expectedStatus())) {
            final WaitingStatus expectedStatus = resolveExpectedStatus(message);
            if (expectedStatus == null) {
                return;
            }

            if (!pushNotificationService.isWaitingStatus(message.waitingId(), expectedStatus)) {
                log.warn(
                        "[PushNotification] delayed task skipped due to stale waiting status {eventId: {}, waitingId: {}, expectedStatus: {}, notificationType: {}}",
                        message.eventId(),
                        message.waitingId(),
                        expectedStatus,
                        message.notificationType()
                );
                return;
            }
        }

        try {
            pushNotificationService.sendNotification(
                    message.waitingId(),
                    PushNotificationSendReqDto.builder()
                            .notificationType(message.notificationType())
                            .customMessage("")
                            .build()
            );
        } catch (final PushNotificationException ex) {
            if (shouldSkip(ex.getErrorCode())) {
                log.warn(
                        "[PushNotification] delayed task skipped {eventId: {}, waitingId: {}, notificationType: {}, reason: {}}",
                        message.eventId(),
                        message.waitingId(),
                        message.notificationType(),
                        ex.getErrorCode()
                );
                return;
            }

            throw ex;
        }
    }

    private boolean isQrReminder(final WaitingFcmTaskMessage message) {
        return message.notificationType() == PushNotificationType.QR_CHECK_REMINDER;
    }

    private boolean shouldSkip(final ErrorCode errorCode) {
        return errorCode == ErrorCode.NOT_FOUND
                || errorCode == ErrorCode.PUSH_NOTIFICATION_NOT_CONFIGURED
                || errorCode == ErrorCode.PUSH_NOTIFICATION_TOKEN_NOT_FOUND
                || errorCode == ErrorCode.PUSH_NOTIFICATION_WAITING_STATUS_MISMATCH
                || errorCode == ErrorCode.INVALID_INPUT;
    }

    private WaitingStatus resolveExpectedStatus(final WaitingFcmTaskMessage message) {
        if (!StringUtils.hasText(message.expectedStatus())) {
            return null;
        }

        try {
            return WaitingStatus.valueOf(message.expectedStatus());
        } catch (final IllegalArgumentException ex) {
            log.warn(
                    "[PushNotification] delayed task skipped due to invalid expected status {eventId: {}, waitingId: {}, expectedStatus: {}}",
                    message.eventId(),
                    message.waitingId(),
                    message.expectedStatus()
            );
            return null;
        }
    }
}
