package com.freeline.domain.boothmanager.service;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventSnapshot;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.boothmanager.converter.BoothManagerConverter;
import com.freeline.domain.boothmanager.dto.response.BoothManagerSseEventResDto;
import com.freeline.domain.boothmanager.dto.response.BoothManagerWaitingItemResDto;

@Slf4j
@Component
@RequiredArgsConstructor
public class BoothManagerWaitingEventConsumer {

    private final BoothManagerSseService boothManagerSseService;

    @RabbitListener(
            queues = "${app.rabbitmq.waiting.sse-queue:waiting.sse.queue}",
            containerFactory = "waitingRabbitListenerContainerFactory"
    )
    public void consume(final WaitingEventMessage message) {
        if (!message.eventType().isSseTarget()) {
            return;
        }

        if (message.boothId() == null || message.waitingId() == null || message.currentStatus() == null) {
            log.warn(
                    "[BoothManagerSSE] waiting event skipped due to missing payload {eventId: {}, eventType: {}}",
                    message.eventId(),
                    message.eventType()
            );
            return;
        }

        final WaitingStatus waitingStatus = parseWaitingStatus(message);
        if (waitingStatus == null) {
            return;
        }

        boothManagerSseService.publishQueueUpdated(toQueueUpdatedPayload(message, waitingStatus));
    }

    private WaitingStatus parseWaitingStatus(final WaitingEventMessage message) {
        try {
            return WaitingStatus.valueOf(message.currentStatus());
        } catch (final IllegalArgumentException ex) {
            log.warn(
                    "[BoothManagerSSE] waiting event skipped due to invalid status {eventId: {}, eventType: {}, status: {}}",
                    message.eventId(),
                    message.eventType(),
                    message.currentStatus()
            );
            return null;
        }
    }

    private BoothManagerSseEventResDto toQueueUpdatedPayload(
            final WaitingEventMessage message,
            final WaitingStatus waitingStatus
    ) {
        final WaitingEventSnapshot snapshot = message.snapshot();
        final BoothManagerWaitingItemResDto item = BoothManagerConverter.toWaitingItemResDto(snapshot);

        return BoothManagerConverter.toSseEventResDto(
                message.eventId(),
                message.eventType().name(),
                message.boothId(),
                message.waitingId(),
                message.previousStatus(),
                waitingStatus.name(),
                resolveOperation(message.eventType().name()),
                resolvePreviousSection(message.previousStatus()),
                resolveSection(waitingStatus),
                item,
                message.occurredAt()
        );
    }

    private String resolveOperation(final String eventType) {
        return switch (eventType) {
            case "WAITING_ENTERED" -> "MOVE";
            case "WAITING_EXITED", "WAITING_EXPIRED", "WAITING_CANCELED" -> "REMOVE";
            default -> "UPSERT";
        };
    }

    private String resolvePreviousSection(final String previousStatus) {
        return switch (previousStatus) {
            case "CALLED", "REGISTERED" -> "FRONT_QUEUE";
            case "ENTERED" -> "IN_USE";
            default -> "NONE";
        };
    }

    private String resolveSection(final WaitingStatus currentStatus) {
        return switch (currentStatus) {
            case CALLED, REGISTERED -> "FRONT_QUEUE";
            case ENTERED, EXITED -> "IN_USE";
            default -> "NONE";
        };
    }
}
