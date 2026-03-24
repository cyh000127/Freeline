package com.freeline.domain.boothmanager.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.domain.booth.entity.WaitingStatus;

@ExtendWith(MockitoExtension.class)
class BoothManagerWaitingEventConsumerTest {

    @Mock
    private BoothManagerSseService boothManagerSseService;

    @Test
    void consume_success_whenSseTargetStatusEvent() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_REGISTERED)
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("CALLED")
                .currentStatus("REGISTERED")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(null)
                .build();

        consumer.consume(message);

        Mockito.verify(boothManagerSseService).publishQueueUpdated(12L, 301L, WaitingStatus.REGISTERED);
    }

    @Test
    void consume_skip_whenEventIsNotSseTarget() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_EXPIRED)
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("CALLED")
                .currentStatus("EXPIRED")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(null)
                .build();

        consumer.consume(message);

        Mockito.verifyNoInteractions(boothManagerSseService);
    }

    @Test
    void consume_skip_whenCurrentStatusIsInvalid() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_CALLED)
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("WAITING")
                .currentStatus("INVALID")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(null)
                .build();

        consumer.consume(message);

        Mockito.verifyNoInteractions(boothManagerSseService);
    }

    @Test
    void consume_skip_whenRequiredPayloadIsMissing() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_ENTERED)
                .waitingId(null)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("REGISTERED")
                .currentStatus("ENTERED")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(null)
                .build();

        consumer.consume(message);

        Mockito.verifyNoInteractions(boothManagerSseService);
    }
}
