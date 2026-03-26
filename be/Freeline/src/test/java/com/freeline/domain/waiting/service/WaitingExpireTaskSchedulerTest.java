package com.freeline.domain.waiting.service;

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
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventPolicy;
import com.freeline.domain.event.repository.EventPolicyRepository;

@ExtendWith(MockitoExtension.class)
class WaitingExpireTaskSchedulerTest {

    private static final LocalDateTime FIXED_NOW = LocalDateTime.of(2026, 3, 25, 16, 0);

    @Mock
    private WaitingExpireDelayPublisher waitingExpireDelayPublisher;

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private BoothPolicyRepository boothPolicyRepository;

    @Mock
    private EventPolicyRepository eventPolicyRepository;

    @Mock
    private WaitingStatusPersistenceService waitingStatusPersistenceService;

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
    void handle_calledEvent_schedulesExpireTask() {
        final WaitingExpireTaskScheduler scheduler = createScheduler();
        final UUID eventId = UUID.randomUUID();
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
                .eventId(eventId)
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

        scheduler.handle(message);

        Mockito.verify(waitingExpireDelayPublisher).publish(
                Mockito.argThat(task -> eventId.equals(task.eventId())
                        && Long.valueOf(301L).equals(task.waitingId())
                        && FIXED_NOW.plusSeconds(180).equals(task.expiresAt())),
                Mockito.eq(Duration.ofSeconds(180))
        );
    }

    @Test
    void handle_calledEvent_usesEventPolicyFallbackForExpireTask() {
        final WaitingExpireTaskScheduler scheduler = createScheduler();
        final UUID eventId = UUID.randomUUID();
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(302L)
                .boothId(12L)
                .visitorId(22L)
                .status(WaitingStatus.CALLED)
                .calledAt(FIXED_NOW)
                .callExpiresAt(null)
                .build();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(eventId)
                .eventType(WaitingEventType.WAITING_CALLED)
                .waitingId(302L)
                .boothId(12L)
                .visitorId(22L)
                .previousStatus("WAITING")
                .currentStatus("CALLED")
                .occurredAt(FIXED_NOW)
                .snapshot(null)
                .build();

        Mockito.when(boothWaitingRepository.findById(302L)).thenReturn(Optional.of(waiting));
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

        scheduler.handle(message);

        Mockito.verify(waitingExpireDelayPublisher).publish(
                Mockito.argThat(task -> eventId.equals(task.eventId())
                        && Long.valueOf(302L).equals(task.waitingId())
                        && FIXED_NOW.plusSeconds(60).equals(task.expiresAt())),
                Mockito.eq(Duration.ofSeconds(60))
        );
    }

    @Test
    void handle_skipsWhenWaitingIsNotCalled() {
        final WaitingExpireTaskScheduler scheduler = createScheduler();
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(303L)
                .boothId(12L)
                .visitorId(23L)
                .status(WaitingStatus.REGISTERED)
                .calledAt(FIXED_NOW)
                .callExpiresAt(FIXED_NOW.plusSeconds(180))
                .build();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_CALLED)
                .waitingId(303L)
                .boothId(12L)
                .visitorId(23L)
                .previousStatus("WAITING")
                .currentStatus("CALLED")
                .occurredAt(FIXED_NOW)
                .snapshot(null)
                .build();

        Mockito.when(boothWaitingRepository.findById(303L)).thenReturn(Optional.of(waiting));

        scheduler.handle(message);

        Mockito.verifyNoInteractions(waitingExpireDelayPublisher);
    }

    @Test
    void handle_expiresImmediatelyWhenDelayIsNotPositive() {
        final WaitingExpireTaskScheduler scheduler = createScheduler();
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(304L)
                .boothId(12L)
                .visitorId(24L)
                .status(WaitingStatus.CALLED)
                .calledAt(FIXED_NOW.minusSeconds(180))
                .callExpiresAt(FIXED_NOW)
                .build();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_CALLED)
                .waitingId(304L)
                .boothId(12L)
                .visitorId(24L)
                .previousStatus("WAITING")
                .currentStatus("CALLED")
                .occurredAt(FIXED_NOW)
                .snapshot(null)
                .build();

        Mockito.when(boothWaitingRepository.findById(304L)).thenReturn(Optional.of(waiting));

        scheduler.handle(message);

        Mockito.verify(waitingStatusPersistenceService).expireWaiting(304L, FIXED_NOW);
        Mockito.verifyNoInteractions(waitingExpireDelayPublisher);
    }

    private WaitingExpireTaskScheduler createScheduler() {
        return new WaitingExpireTaskScheduler(
                waitingExpireDelayPublisher,
                boothWaitingRepository,
                new WaitingPolicyResolver(
                        boothRepository,
                        boothPolicyRepository,
                        eventPolicyRepository
                ),
                waitingStatusPersistenceService
        );
    }
}
