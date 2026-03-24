package com.freeline.domain.pushnotification.service;

import java.util.UUID;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.pushnotification.dto.message.WaitingFcmTaskMessage;
import com.freeline.domain.pushnotification.entity.PushNotificationType;
import com.freeline.domain.pushnotification.exception.PushNotificationException;

@ExtendWith(MockitoExtension.class)
class WaitingFcmDelayedConsumerTest {

    @Mock
    private PushNotificationService pushNotificationService;

    @Test
    void consume_success() {
        final WaitingFcmDelayedConsumer consumer = new WaitingFcmDelayedConsumer(pushNotificationService);
        final WaitingFcmTaskMessage message = WaitingFcmTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .expectedStatus("CALLED")
                .notificationType(PushNotificationType.QR_CHECK_REMINDER)
                .build();

        Mockito.when(pushNotificationService.isConfigured()).thenReturn(true);
        Mockito.when(pushNotificationService.isWaitingStatus(301L, WaitingStatus.CALLED))
                .thenReturn(true);

        consumer.consume(message);

        Mockito.verify(pushNotificationService).sendNotification(
                Mockito.eq(301L),
                Mockito.argThat(request -> request.notificationType() == PushNotificationType.QR_CHECK_REMINDER)
        );
    }

    @Test
    void consume_missingPayload_skips() {
        final WaitingFcmDelayedConsumer consumer = new WaitingFcmDelayedConsumer(pushNotificationService);
        final WaitingFcmTaskMessage message = WaitingFcmTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(null)
                .notificationType(PushNotificationType.QR_CHECK_REMINDER)
                .build();

        consumer.consume(message);

        Mockito.verifyNoInteractions(pushNotificationService);
    }

    @Test
    void consume_statusMismatch_skips() {
        final WaitingFcmDelayedConsumer consumer = new WaitingFcmDelayedConsumer(pushNotificationService);
        final WaitingFcmTaskMessage message = WaitingFcmTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .expectedStatus("CALLED")
                .notificationType(PushNotificationType.QR_CHECK_REMINDER)
                .build();

        Mockito.when(pushNotificationService.isConfigured()).thenReturn(true);
        Mockito.when(pushNotificationService.isWaitingStatus(301L, WaitingStatus.CALLED))
                .thenReturn(true);
        Mockito.doThrow(new PushNotificationException(ErrorCode.PUSH_NOTIFICATION_WAITING_STATUS_MISMATCH))
                .when(pushNotificationService)
                .sendNotification(Mockito.eq(301L), Mockito.any());

        consumer.consume(message);

        Mockito.verify(pushNotificationService).sendNotification(Mockito.eq(301L), Mockito.any());
    }

    @Test
    void consume_sendFailed_throws() {
        final WaitingFcmDelayedConsumer consumer = new WaitingFcmDelayedConsumer(pushNotificationService);
        final WaitingFcmTaskMessage message = WaitingFcmTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .expectedStatus("CALLED")
                .notificationType(PushNotificationType.QR_CHECK_REMINDER)
                .build();

        Mockito.when(pushNotificationService.isConfigured()).thenReturn(true);
        Mockito.when(pushNotificationService.isWaitingStatus(301L, WaitingStatus.CALLED))
                .thenReturn(true);
        Mockito.doThrow(new PushNotificationException(ErrorCode.PUSH_NOTIFICATION_SEND_FAILED))
                .when(pushNotificationService)
                .sendNotification(Mockito.eq(301L), Mockito.any());

        Assertions.assertThatThrownBy(() -> consumer.consume(message))
                .isInstanceOf(PushNotificationException.class)
                .hasMessage(ErrorCode.PUSH_NOTIFICATION_SEND_FAILED.getMessage());
    }

    @Test
    void consume_skipsWhenPushSenderIsNotConfigured() {
        final WaitingFcmDelayedConsumer consumer = new WaitingFcmDelayedConsumer(pushNotificationService);
        final WaitingFcmTaskMessage message = WaitingFcmTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .expectedStatus("CALLED")
                .notificationType(PushNotificationType.QR_CHECK_REMINDER)
                .build();

        Mockito.when(pushNotificationService.isConfigured()).thenReturn(false);

        consumer.consume(message);

        Mockito.verify(pushNotificationService).isConfigured();
        Mockito.verify(pushNotificationService, Mockito.never()).sendNotification(Mockito.anyLong(), Mockito.any());
    }

    @Test
    void consume_expectedStatusMismatch_skipsBeforeSend() {
        final WaitingFcmDelayedConsumer consumer = new WaitingFcmDelayedConsumer(pushNotificationService);
        final WaitingFcmTaskMessage message = WaitingFcmTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .expectedStatus("CALLED")
                .notificationType(PushNotificationType.QR_CHECK_REMINDER)
                .build();

        Mockito.when(pushNotificationService.isConfigured()).thenReturn(true);
        Mockito.when(pushNotificationService.isWaitingStatus(301L, WaitingStatus.CALLED))
                .thenReturn(false);

        consumer.consume(message);

        Mockito.verify(pushNotificationService).isWaitingStatus(301L, WaitingStatus.CALLED);
        Mockito.verify(pushNotificationService, Mockito.never()).sendNotification(Mockito.anyLong(), Mockito.any());
    }

    @Test
    void consume_notConfiguredException_skips() {
        final WaitingFcmDelayedConsumer consumer = new WaitingFcmDelayedConsumer(pushNotificationService);
        final WaitingFcmTaskMessage message = WaitingFcmTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .expectedStatus("CALLED")
                .notificationType(PushNotificationType.QR_CHECK_REMINDER)
                .build();

        Mockito.when(pushNotificationService.isConfigured()).thenReturn(true);
        Mockito.when(pushNotificationService.isWaitingStatus(301L, WaitingStatus.CALLED))
                .thenReturn(true);
        Mockito.doThrow(new PushNotificationException(ErrorCode.PUSH_NOTIFICATION_NOT_CONFIGURED))
                .when(pushNotificationService)
                .sendNotification(Mockito.eq(301L), Mockito.any());

        Assertions.assertThatCode(() -> consumer.consume(message))
                .doesNotThrowAnyException();
    }
}
