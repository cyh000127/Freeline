package com.freeline.domain.pushnotification.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.pushnotification.entity.PushNotificationType;

@ExtendWith(MockitoExtension.class)
class WaitingFcmEventConsumerTest {

    private static final LocalDateTime FIXED_NOW = LocalDateTime.of(2026, 3, 23, 12, 0);

    @Mock
    private PushNotificationService pushNotificationService;

    @Mock
    private WaitingFcmDelayPublisher waitingFcmDelayPublisher;

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private BoothPolicyRepository boothPolicyRepository;

    private MockedStatic<TimeUtils> timeUtilsMock;

    @BeforeEach
    void setUp() {
        timeUtilsMock = Mockito.mockStatic(TimeUtils.class);
        timeUtilsMock.when(TimeUtils::nowDateTime).thenReturn(FIXED_NOW);
    }

    @AfterEach
    void tearDown() {
        timeUtilsMock.close();
    }

    @Test
    void consume_calledEvent_sendsImmediateNotificationAndSchedulesReminder() {
        final WaitingFcmEventConsumer consumer = new WaitingFcmEventConsumer(
                pushNotificationService,
                waitingFcmDelayPublisher,
                boothWaitingRepository,
                boothPolicyRepository
        );
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(301L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.CALLED)
                .calledAt(FIXED_NOW)
                .callExpiresAt(FIXED_NOW.plusSeconds(180))
                .build();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_CALLED)
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("WAITING")
                .currentStatus("CALLED")
                .occurredAt(FIXED_NOW)
                .snapshot(null)
                .build();

        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        consumer.consume(message);

        Mockito.verify(pushNotificationService).sendNotification(
                Mockito.eq(301L),
                Mockito.argThat(request -> request.notificationType() == PushNotificationType.FRONT_QUEUE_CALLED)
        );
        Mockito.verify(waitingFcmDelayPublisher).publish(
                Mockito.argThat(task -> task.notificationType() == PushNotificationType.QR_CHECK_REMINDER
                        && "CALLED".equals(task.expectedStatus())),
                Mockito.eq(Duration.ofSeconds(90))
        );
    }

    @Test
    void consume_enteredEvent_schedulesExitReminder() {
        final WaitingFcmEventConsumer consumer = new WaitingFcmEventConsumer(
                pushNotificationService,
                waitingFcmDelayPublisher,
                boothWaitingRepository,
                boothPolicyRepository
        );
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(302L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.ENTERED)
                .enteredAt(FIXED_NOW)
                .build();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_ENTERED)
                .waitingId(302L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("REGISTERED")
                .currentStatus("ENTERED")
                .occurredAt(FIXED_NOW)
                .snapshot(null)
                .build();

        Mockito.when(boothWaitingRepository.findById(302L)).thenReturn(Optional.of(waiting));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(
                BoothPolicy.builder()
                        .id(1L)
                        .boothId(12L)
                        .stayTime(600)
                        .build()
        ));

        consumer.consume(message);

        Mockito.verifyNoInteractions(pushNotificationService);
        Mockito.verify(waitingFcmDelayPublisher).publish(
                Mockito.argThat(task -> task.notificationType() == PushNotificationType.EXIT_ACTION_REQUIRED
                        && "ENTERED".equals(task.expectedStatus())),
                Mockito.eq(Duration.ofSeconds(600))
        );
    }

    @Test
    void consume_skipsWhenEventIsNotFcmTarget() {
        final WaitingFcmEventConsumer consumer = new WaitingFcmEventConsumer(
                pushNotificationService,
                waitingFcmDelayPublisher,
                boothWaitingRepository,
                boothPolicyRepository
        );
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_CREATED)
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("NONE")
                .currentStatus("WAITING")
                .occurredAt(FIXED_NOW)
                .snapshot(null)
                .build();

        consumer.consume(message);

        Mockito.verifyNoInteractions(pushNotificationService, waitingFcmDelayPublisher, boothWaitingRepository, boothPolicyRepository);
    }
}
