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
import com.freeline.common.event.waiting.model.WaitingEventSnapshot;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.common.event.waiting.publisher.WaitingEventPublishListener;
import com.freeline.common.event.waiting.publisher.WaitingEventPublisher;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.boothmanager.dto.response.BoothManagerSseEventResDto;
import com.freeline.domain.boothmanager.service.BoothManagerSseService;
import com.freeline.domain.boothmanager.service.BoothManagerWaitingEventConsumer;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventPolicy;
import com.freeline.domain.event.repository.EventPolicyRepository;
import com.freeline.domain.pushnotification.entity.PushNotificationType;
import com.freeline.domain.pushnotification.service.PushNotificationService;
import com.freeline.domain.pushnotification.service.WaitingFcmDelayPublisher;
import com.freeline.domain.pushnotification.service.WaitingFcmEventConsumer;
import com.freeline.domain.waiting.service.WaitingPolicyResolver;

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

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private EventPolicyRepository eventPolicyRepository;

    private MockedStatic<TimeUtils> timeUtilsMock;

    @BeforeEach
    void setUp() {
        timeUtilsMock = Mockito.mockStatic(TimeUtils.class);
        timeUtilsMock.when(TimeUtils::nowDateTime).thenReturn(FIXED_NOW);
        Mockito.lenient().when(pushNotificationService.isConfigured()).thenReturn(true);
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
                new WaitingPolicyResolver(
                        boothRepository,
                        boothPolicyRepository,
                        eventPolicyRepository
                )
        );

        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_CALLED,
                301L,
                12L,
                21L,
                WaitingStatus.WAITING.name(),
                WaitingStatus.CALLED.name(),
                WaitingEventSnapshot.builder()
                        .waitingId(301L)
                        .waitingNumber(7)
                        .visitorId(21L)
                        .visitorName("김싸피")
                        .status("CALLED")
                        .arrivalChecked(false)
                        .calledAt(FIXED_NOW)
                        .build()
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

        final ArgumentCaptor<BoothManagerSseEventResDto> calledCaptor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(calledCaptor.capture());
        Assertions.assertThat(calledCaptor.getValue().eventType()).isEqualTo("WAITING_CALLED");
        Assertions.assertThat(calledCaptor.getValue().operation()).isEqualTo("UPSERT");
        Assertions.assertThat(calledCaptor.getValue().previousSection()).isEqualTo("NONE");
        Assertions.assertThat(calledCaptor.getValue().section()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(calledCaptor.getValue().item()).isNotNull();
        Assertions.assertThat(calledCaptor.getValue().item().waitingNumber()).isEqualTo(7);
        Mockito.verify(pushNotificationService).sendNotification(
                Mockito.eq(301L),
                Mockito.argThat(request -> request.notificationType() == PushNotificationType.FRONT_QUEUE_CALLED)
        );
        Mockito.verify(waitingFcmDelayPublisher).publish(
                Mockito.argThat(task -> task.notificationType() == PushNotificationType.QR_CHECK_REMINDER
                        && "CALLED".equals(task.expectedStatus())
                        && message.eventId().equals(task.eventId())),
                Mockito.eq(Duration.ofSeconds(90))
        );
    }

    @Test
    void WAITING_ENTERED_흐름이_SSE와_지연_FCM_후속처리까지_이어진다() {
        final WaitingEventPublishListener publishListener = new WaitingEventPublishListener(waitingEventPublisher);
        final BoothManagerWaitingEventConsumer sseConsumer = createSseConsumer();
        final WaitingFcmEventConsumer fcmConsumer = createFcmConsumer();

        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_ENTERED,
                302L,
                12L,
                21L,
                WaitingStatus.REGISTERED.name(),
                WaitingStatus.ENTERED.name(),
                WaitingEventSnapshot.builder()
                        .waitingId(302L)
                        .waitingNumber(2)
                        .visitorId(21L)
                        .visitorName("김싸피")
                        .status("ENTERED")
                        .arrivalChecked(false)
                        .enteredAt(FIXED_NOW)
                        .build()
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

        final ArgumentCaptor<BoothManagerSseEventResDto> enteredCaptor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(enteredCaptor.capture());
        Assertions.assertThat(enteredCaptor.getValue().eventType()).isEqualTo("WAITING_ENTERED");
        Assertions.assertThat(enteredCaptor.getValue().operation()).isEqualTo("MOVE");
        Assertions.assertThat(enteredCaptor.getValue().previousSection()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(enteredCaptor.getValue().section()).isEqualTo("IN_USE");
        Assertions.assertThat(enteredCaptor.getValue().item()).isNotNull();
        Assertions.assertThat(enteredCaptor.getValue().item().status()).isEqualTo("ENTERED");
        Mockito.verify(pushNotificationService).isConfigured();
        Mockito.verify(pushNotificationService, Mockito.never()).sendNotification(Mockito.anyLong(), Mockito.any());
        Mockito.verify(waitingFcmDelayPublisher).publish(
                Mockito.argThat(task -> task.notificationType() == PushNotificationType.EXIT_ACTION_REQUIRED
                        && "ENTERED".equals(task.expectedStatus())
                        && message.eventId().equals(task.eventId())),
                Mockito.eq(Duration.ofSeconds(600))
        );
    }

    @Test
    void WAITING_CALLED_흐름이_eventPolicy_fallback과_snapshot을_함께_반영한다() {
        final WaitingEventPublishListener publishListener = new WaitingEventPublishListener(waitingEventPublisher);
        final BoothManagerWaitingEventConsumer sseConsumer = createSseConsumer();
        final WaitingFcmEventConsumer fcmConsumer = createFcmConsumer();
        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_CALLED,
                303L,
                12L,
                25L,
                WaitingStatus.WAITING.name(),
                WaitingStatus.CALLED.name(),
                WaitingEventSnapshot.builder()
                        .waitingId(303L)
                        .waitingNumber(9)
                        .visitorId(25L)
                        .visitorName("이프리라인")
                        .status("CALLED")
                        .arrivalChecked(false)
                        .calledAt(FIXED_NOW)
                        .build()
        );
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(303L)
                .boothId(12L)
                .visitorId(25L)
                .status(WaitingStatus.CALLED)
                .calledAt(FIXED_NOW)
                .callExpiresAt(null)
                .build();

        Mockito.when(boothWaitingRepository.findById(303L)).thenReturn(Optional.of(waiting));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.empty());
        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(
                Booth.builder()
                        .id(12L)
                        .eventId(3L)
                        .name("Goods Booth")
                        .build()
        ));
        Mockito.when(eventPolicyRepository.findByEvent_Id(3L)).thenReturn(Optional.of(
                EventPolicy.builder()
                        .id(1L)
                        .event(Event.builder().id(3L).build())
                        .defaultStaySec(300)
                        .defaultMaxWaiting(100)
                        .defaultCallCount(5)
                        .defaultCallTtl(60)
                        .defaultDeferLimit(2)
                        .build()
        ));

        final WaitingEventMessage message = dispatch(command);

        publishListener.handle(message);
        sseConsumer.consume(message);
        fcmConsumer.consume(message);

        final ArgumentCaptor<BoothManagerSseEventResDto> calledCaptor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(calledCaptor.capture());
        Assertions.assertThat(calledCaptor.getValue().item()).isNotNull();
        Assertions.assertThat(calledCaptor.getValue().item().waitingNumber()).isEqualTo(9);
        Assertions.assertThat(calledCaptor.getValue().item().visitorName()).isEqualTo("이프리라인");
        Mockito.verify(waitingFcmDelayPublisher).publish(
                Mockito.argThat(task -> task.notificationType() == PushNotificationType.QR_CHECK_REMINDER
                        && "CALLED".equals(task.expectedStatus())
                        && message.eventId().equals(task.eventId())),
                Mockito.eq(Duration.ofSeconds(30))
        );
    }

    @Test
    void WAITING_EXPIRED_흐름이_SSE_REMOVE와_FCM_만료_알림으로_이어진다() {
        final WaitingEventPublishListener publishListener = new WaitingEventPublishListener(waitingEventPublisher);
        final BoothManagerWaitingEventConsumer sseConsumer = createSseConsumer();
        final WaitingFcmEventConsumer fcmConsumer = createFcmConsumer();
        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_EXPIRED,
                304L,
                12L,
                26L,
                WaitingStatus.CALLED.name(),
                WaitingStatus.EXPIRED.name(),
                WaitingEventSnapshot.builder()
                        .waitingId(304L)
                        .waitingNumber(10)
                        .visitorId(26L)
                        .visitorName("박프리라인")
                        .status("EXPIRED")
                        .arrivalChecked(false)
                        .calledAt(FIXED_NOW.minusSeconds(60))
                        .build()
        );

        final WaitingEventMessage message = dispatch(command);

        publishListener.handle(message);
        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.SSE, message);
        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.FCM, message);

        sseConsumer.consume(message);
        fcmConsumer.consume(message);

        final ArgumentCaptor<BoothManagerSseEventResDto> expiredCaptor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(expiredCaptor.capture());
        Assertions.assertThat(expiredCaptor.getValue().eventType()).isEqualTo("WAITING_EXPIRED");
        Assertions.assertThat(expiredCaptor.getValue().operation()).isEqualTo("REMOVE");
        Assertions.assertThat(expiredCaptor.getValue().previousSection()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(expiredCaptor.getValue().section()).isEqualTo("NONE");
        Mockito.verify(pushNotificationService).sendNotification(
                Mockito.eq(304L),
                Mockito.argThat(request -> request.notificationType() == PushNotificationType.WAITING_EXPIRED)
        );
        Mockito.verifyNoInteractions(waitingFcmDelayPublisher);
    }

    @Test
    void WAITING_CANCELED_흐름은_SSE만_발행하고_FCM은_발행하지_않는다() {
        final WaitingEventPublishListener publishListener = new WaitingEventPublishListener(waitingEventPublisher);
        final BoothManagerWaitingEventConsumer sseConsumer = createSseConsumer();
        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_CANCELED,
                305L,
                12L,
                27L,
                WaitingStatus.REGISTERED.name(),
                WaitingStatus.CANCELED.name(),
                WaitingEventSnapshot.builder()
                        .waitingId(305L)
                        .waitingNumber(11)
                        .visitorId(27L)
                        .visitorName("최프리라인")
                        .status("CANCELED")
                        .arrivalChecked(false)
                        .registeredAt(FIXED_NOW.minusSeconds(10))
                        .build()
        );

        final WaitingEventMessage message = dispatch(command);

        publishListener.handle(message);
        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.SSE, message);
        Mockito.verify(waitingEventPublisher, Mockito.never()).publish(WaitingEventChannel.FCM, message);

        sseConsumer.consume(message);

        final ArgumentCaptor<BoothManagerSseEventResDto> canceledCaptor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(canceledCaptor.capture());
        Assertions.assertThat(canceledCaptor.getValue().eventType()).isEqualTo("WAITING_CANCELED");
        Assertions.assertThat(canceledCaptor.getValue().operation()).isEqualTo("REMOVE");
        Assertions.assertThat(canceledCaptor.getValue().previousSection()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(canceledCaptor.getValue().section()).isEqualTo("NONE");
        Mockito.verifyNoInteractions(pushNotificationService, waitingFcmDelayPublisher, boothWaitingRepository);
    }

    @Test
    void WAITING_CANCELED_대기상태는_SSE를_발행하지_않는다() {
        final WaitingEventPublishListener publishListener = new WaitingEventPublishListener(waitingEventPublisher);
        final BoothManagerWaitingEventConsumer sseConsumer = createSseConsumer();
        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_CANCELED,
                307L,
                12L,
                29L,
                WaitingStatus.WAITING.name(),
                WaitingStatus.CANCELED.name(),
                WaitingEventSnapshot.builder()
                        .waitingId(307L)
                        .waitingNumber(13)
                        .visitorId(29L)
                        .visitorName("윤프리라인")
                        .status("CANCELED")
                        .arrivalChecked(false)
                        .build()
        );

        final WaitingEventMessage message = dispatch(command);

        publishListener.handle(message);
        Mockito.verifyNoInteractions(waitingEventPublisher);

        sseConsumer.consume(message);

        Mockito.verifyNoInteractions(boothManagerSseService);
        Mockito.verifyNoInteractions(pushNotificationService, waitingFcmDelayPublisher, boothWaitingRepository);
    }

    private BoothManagerWaitingEventConsumer createSseConsumer() {
        return new BoothManagerWaitingEventConsumer(boothManagerSseService);
    }

    private WaitingFcmEventConsumer createFcmConsumer() {
        return new WaitingFcmEventConsumer(
                pushNotificationService,
                waitingFcmDelayPublisher,
                boothWaitingRepository,
                new WaitingPolicyResolver(
                        boothRepository,
                        boothPolicyRepository,
                        eventPolicyRepository
                )
        );
    }

    private WaitingEventMessage dispatch(final WaitingStatusChangeCommand command) {
        final WaitingStatusChangeDetector detector = new WaitingStatusChangeDetector();
        final WaitingEventDispatcher dispatcher = new WaitingEventDispatcher(detector, applicationEventPublisher);

        dispatcher.dispatch(command);

        final ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        Mockito.verify(applicationEventPublisher).publishEvent(captor.capture());
        Assertions.assertThat(captor.getValue()).isInstanceOf(WaitingEventMessage.class);
        final WaitingEventMessage message = (WaitingEventMessage) captor.getValue();
        Assertions.assertThat(message.schemaVersion()).isEqualTo(1);
        Assertions.assertThat(message.snapshot()).isNotNull();
        return message;
    }
}
