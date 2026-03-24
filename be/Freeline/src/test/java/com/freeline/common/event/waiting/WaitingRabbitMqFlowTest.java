package com.freeline.common.event.waiting;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import com.freeline.common.event.waiting.detector.WaitingStatusChangeCommand;
import com.freeline.common.event.waiting.detector.WaitingStatusChangeDetector;
import com.freeline.common.event.waiting.dispatcher.WaitingEventDispatcher;
import com.freeline.common.event.waiting.model.WaitingEventChannel;
import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.common.event.waiting.publisher.WaitingEventPublishListener;
import com.freeline.common.event.waiting.publisher.WaitingEventPublisher;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.boothmanager.service.BoothManagerSseService;
import com.freeline.domain.boothmanager.service.BoothManagerWaitingEventConsumer;
import com.freeline.domain.pushnotification.entity.PushNotificationType;
import com.freeline.domain.pushnotification.service.PushNotificationService;
import com.freeline.domain.pushnotification.service.WaitingFcmDelayPublisher;
import com.freeline.domain.pushnotification.service.WaitingFcmEventConsumer;

@ExtendWith(MockitoExtension.class)
class WaitingRabbitMqFlowTest {

    private static final LocalDateTime FIXED_NOW = LocalDateTime.of(2026, 3, 23, 12, 0);

    @Mock
    private ApplicationEventPublisher applicationEventPublisher;

    @Mock
    private WaitingEventPublisher waitingEventPublisher;

    @Mock
    private BoothManagerSseService boothManagerSseService;

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
    void WAITING_CALLED_흐름이_SSE와_FCM_후속처리까지_이어진다() {
        final WaitingStatusChangeDetector detector = new WaitingStatusChangeDetector();
        final WaitingEventDispatcher dispatcher = new WaitingEventDispatcher(detector, applicationEventPublisher);
        final WaitingEventPublishListener publishListener = new WaitingEventPublishListener(waitingEventPublisher);
        final BoothManagerWaitingEventConsumer sseConsumer =
                new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final WaitingFcmEventConsumer fcmConsumer = new WaitingFcmEventConsumer(
                pushNotificationService,
                waitingFcmDelayPublisher,
                boothWaitingRepository,
                boothPolicyRepository
        );

        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_CALLED,
                301L,
                12L,
                21L,
                WaitingStatus.WAITING.name(),
                WaitingStatus.CALLED.name()
        );
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(301L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.CALLED)
                .calledAt(FIXED_NOW)
                .callExpiresAt(FIXED_NOW.plusSeconds(180))
                .build();

        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        final WaitingEventMessage message = dispatch(command);

        publishListener.handle(message);

        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.SSE, message);
        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.FCM, message);

        sseConsumer.consume(message);
        fcmConsumer.consume(message);

        Mockito.verify(boothManagerSseService).publishQueueUpdated(12L, 301L, WaitingStatus.CALLED);
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
    void WAITING_ENTERED_흐름이_SSE와_지연_FCM_후속처리까지_이어진다() {
        final WaitingStatusChangeDetector detector = new WaitingStatusChangeDetector();
        final WaitingEventDispatcher dispatcher = new WaitingEventDispatcher(detector, applicationEventPublisher);
        final WaitingEventPublishListener publishListener = new WaitingEventPublishListener(waitingEventPublisher);
        final BoothManagerWaitingEventConsumer sseConsumer =
                new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final WaitingFcmEventConsumer fcmConsumer = new WaitingFcmEventConsumer(
                pushNotificationService,
                waitingFcmDelayPublisher,
                boothWaitingRepository,
                boothPolicyRepository
        );

        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_ENTERED,
                302L,
                12L,
                21L,
                WaitingStatus.REGISTERED.name(),
                WaitingStatus.ENTERED.name()
        );
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(302L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.ENTERED)
                .enteredAt(FIXED_NOW)
                .build();

        Mockito.when(boothWaitingRepository.findById(302L)).thenReturn(Optional.of(waiting));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(
                BoothPolicy.builder()
                        .id(1L)
                        .boothId(12L)
                        .stayTime(600)
                        .build()
        ));

        final WaitingEventMessage message = dispatch(command);

        publishListener.handle(message);

        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.SSE, message);
        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.FCM, message);

        sseConsumer.consume(message);
        fcmConsumer.consume(message);

        Mockito.verify(boothManagerSseService).publishQueueUpdated(12L, 302L, WaitingStatus.ENTERED);
        Mockito.verifyNoInteractions(pushNotificationService);
        Mockito.verify(waitingFcmDelayPublisher).publish(
                Mockito.argThat(task -> task.notificationType() == PushNotificationType.EXIT_ACTION_REQUIRED
                        && "ENTERED".equals(task.expectedStatus())),
                Mockito.eq(Duration.ofSeconds(600))
        );
    }

    private WaitingEventMessage dispatch(final WaitingStatusChangeCommand command) {
        final WaitingStatusChangeDetector detector = new WaitingStatusChangeDetector();
        final WaitingEventDispatcher dispatcher = new WaitingEventDispatcher(detector, applicationEventPublisher);

        dispatcher.dispatch(command);

        final ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        Mockito.verify(applicationEventPublisher).publishEvent(captor.capture());
        Assertions.assertThat(captor.getValue()).isInstanceOf(WaitingEventMessage.class);
        return (WaitingEventMessage) captor.getValue();
    }
}
