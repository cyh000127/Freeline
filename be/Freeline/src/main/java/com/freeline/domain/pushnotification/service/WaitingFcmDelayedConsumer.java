package com.freeline.domain.pushnotification.service;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.pushnotification.dto.message.WaitingFcmTaskMessage;
import com.freeline.domain.pushnotification.dto.request.PushNotificationSendReqDto;
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

    private boolean shouldSkip(final ErrorCode errorCode) {
        return errorCode == ErrorCode.NOT_FOUND
                || errorCode == ErrorCode.PUSH_NOTIFICATION_TOKEN_NOT_FOUND
                || errorCode == ErrorCode.PUSH_NOTIFICATION_WAITING_STATUS_MISMATCH
                || errorCode == ErrorCode.INVALID_INPUT;
    }
}
