package com.freeline.domain.boothmanager.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventSnapshot;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.domain.boothmanager.dto.response.BoothManagerSseEventResDto;

@ExtendWith(MockitoExtension.class)
class BoothManagerWaitingEventConsumerTest {

    @Mock
    private BoothManagerSseService boothManagerSseService;

    @Test
    void consume_success_whenSseTargetStatusEvent() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final UUID eventId = UUID.randomUUID();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(eventId)
                .eventType(WaitingEventType.WAITING_REGISTERED)
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("CALLED")
                .currentStatus("REGISTERED")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(WaitingEventSnapshot.builder()
                        .waitingId(301L)
                        .waitingNumber(7)
                        .visitorId(21L)
                        .visitorName("김싸피")
                        .status("REGISTERED")
                        .arrivalChecked(true)
                        .calledAt(LocalDateTime.of(2026, 3, 23, 11, 58))
                        .registeredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                        .build())
                .build();

        consumer.consume(message);

        final ArgumentCaptor<BoothManagerSseEventResDto> captor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(captor.capture());
        final BoothManagerSseEventResDto payload = captor.getValue();
        Assertions.assertThat(payload.eventId()).isEqualTo(eventId);
        Assertions.assertThat(payload.eventType()).isEqualTo("WAITING_REGISTERED");
        Assertions.assertThat(payload.boothId()).isEqualTo(12L);
        Assertions.assertThat(payload.waitingId()).isEqualTo(301L);
        Assertions.assertThat(payload.previousStatus()).isEqualTo("CALLED");
        Assertions.assertThat(payload.changedStatus()).isEqualTo("REGISTERED");
        Assertions.assertThat(payload.operation()).isEqualTo("UPSERT");
        Assertions.assertThat(payload.previousSection()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(payload.section()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(payload.item()).isNotNull();
        Assertions.assertThat(payload.item().waitingNumber()).isEqualTo(7);
        Assertions.assertThat(payload.item().visitorName()).isEqualTo("김싸피");
    }

    @Test
    void consume_success_whenCalledEventAddsFrontQueueItem() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final UUID eventId = UUID.randomUUID();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(eventId)
                .eventType(WaitingEventType.WAITING_CALLED)
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("WAITING")
                .currentStatus("CALLED")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(WaitingEventSnapshot.builder()
                        .waitingId(301L)
                        .waitingNumber(7)
                        .visitorId(21L)
                        .visitorName("김싸피")
                        .status("CALLED")
                        .arrivalChecked(false)
                        .calledAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                        .build())
                .build();

        consumer.consume(message);

        final ArgumentCaptor<BoothManagerSseEventResDto> captor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(captor.capture());
        final BoothManagerSseEventResDto payload = captor.getValue();
        Assertions.assertThat(payload.eventId()).isEqualTo(eventId);
        Assertions.assertThat(payload.eventType()).isEqualTo("WAITING_CALLED");
        Assertions.assertThat(payload.operation()).isEqualTo("UPSERT");
        Assertions.assertThat(payload.previousSection()).isEqualTo("NONE");
        Assertions.assertThat(payload.section()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(payload.item()).isNotNull();
        Assertions.assertThat(payload.item().waitingNumber()).isEqualTo(7);
    }

    @Test
    void consume_success_whenEnteredEventMovesFrontQueueToInUse() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final UUID eventId = UUID.randomUUID();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(eventId)
                .eventType(WaitingEventType.WAITING_ENTERED)
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("REGISTERED")
                .currentStatus("ENTERED")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(WaitingEventSnapshot.builder()
                        .waitingId(301L)
                        .waitingNumber(7)
                        .visitorId(21L)
                        .visitorName("김싸피")
                        .status("ENTERED")
                        .arrivalChecked(true)
                        .calledAt(LocalDateTime.of(2026, 3, 23, 11, 58))
                        .registeredAt(LocalDateTime.of(2026, 3, 23, 11, 59))
                        .enteredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                        .build())
                .build();

        consumer.consume(message);

        final ArgumentCaptor<BoothManagerSseEventResDto> captor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(captor.capture());
        final BoothManagerSseEventResDto payload = captor.getValue();
        Assertions.assertThat(payload.eventId()).isEqualTo(eventId);
        Assertions.assertThat(payload.eventType()).isEqualTo("WAITING_ENTERED");
        Assertions.assertThat(payload.operation()).isEqualTo("MOVE");
        Assertions.assertThat(payload.previousSection()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(payload.section()).isEqualTo("IN_USE");
    }

    @Test
    void consume_success_whenExpiredEventRemovesFrontQueueItem() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final UUID eventId = UUID.randomUUID();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(eventId)
                .eventType(WaitingEventType.WAITING_EXPIRED)
                .waitingId(301L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("CALLED")
                .currentStatus("EXPIRED")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(WaitingEventSnapshot.builder()
                        .waitingId(301L)
                        .waitingNumber(7)
                        .visitorId(21L)
                        .visitorName("김싸피")
                        .status("EXPIRED")
                        .arrivalChecked(false)
                        .calledAt(LocalDateTime.of(2026, 3, 23, 11, 58))
                        .build())
                .build();

        consumer.consume(message);

        final ArgumentCaptor<BoothManagerSseEventResDto> captor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(captor.capture());
        final BoothManagerSseEventResDto payload = captor.getValue();
        Assertions.assertThat(payload.eventId()).isEqualTo(eventId);
        Assertions.assertThat(payload.eventType()).isEqualTo("WAITING_EXPIRED");
        Assertions.assertThat(payload.operation()).isEqualTo("REMOVE");
        Assertions.assertThat(payload.previousSection()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(payload.section()).isEqualTo("NONE");
        Assertions.assertThat(payload.item()).isNotNull();
        Assertions.assertThat(payload.item().status()).isEqualTo("EXPIRED");
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

    @Test
    void consume_skip_whenCanceledEventDoesNotAffectVisibleSections() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_CANCELED)
                .waitingId(302L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("WAITING")
                .currentStatus("CANCELED")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(WaitingEventSnapshot.builder()
                        .waitingId(302L)
                        .waitingNumber(8)
                        .visitorId(21L)
                        .visitorName("김싸피")
                        .status("CANCELED")
                        .arrivalChecked(false)
                        .build())
                .build();

        consumer.consume(message);

        Mockito.verifyNoInteractions(boothManagerSseService);
    }

    @Test
    void consume_success_whenCanceledEventRemovesFrontQueueItem() {
        final BoothManagerWaitingEventConsumer consumer = new BoothManagerWaitingEventConsumer(boothManagerSseService);
        final UUID eventId = UUID.randomUUID();
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(eventId)
                .eventType(WaitingEventType.WAITING_CANCELED)
                .waitingId(302L)
                .boothId(12L)
                .visitorId(21L)
                .previousStatus("REGISTERED")
                .currentStatus("CANCELED")
                .occurredAt(LocalDateTime.of(2026, 3, 23, 12, 0))
                .snapshot(WaitingEventSnapshot.builder()
                        .waitingId(302L)
                        .waitingNumber(8)
                        .visitorId(21L)
                        .visitorName("김싸피")
                        .status("CANCELED")
                        .arrivalChecked(false)
                        .build())
                .build();

        consumer.consume(message);

        final ArgumentCaptor<BoothManagerSseEventResDto> captor =
                ArgumentCaptor.forClass(BoothManagerSseEventResDto.class);
        Mockito.verify(boothManagerSseService).publishQueueUpdated(captor.capture());
        final BoothManagerSseEventResDto payload = captor.getValue();
        Assertions.assertThat(payload.eventId()).isEqualTo(eventId);
        Assertions.assertThat(payload.eventType()).isEqualTo("WAITING_CANCELED");
        Assertions.assertThat(payload.operation()).isEqualTo("REMOVE");
        Assertions.assertThat(payload.previousSection()).isEqualTo("FRONT_QUEUE");
        Assertions.assertThat(payload.section()).isEqualTo("NONE");
    }
}
