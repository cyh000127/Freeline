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

        if (!shouldPublishQueueUpdate(message.previousStatus(), waitingStatus)) {
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
        final String previousSection = resolveSection(message.previousStatus());
        final String currentSection = resolveSection(waitingStatus);

        return BoothManagerConverter.toSseEventResDto(
                message.eventId(),
                message.eventType().name(),
                message.boothId(),
                message.waitingId(),
                message.previousStatus(),
                waitingStatus.name(),
                resolveOperation(previousSection, currentSection),
                previousSection,
                currentSection,
                item,
                message.occurredAt()
        );
    }

    private boolean shouldPublishQueueUpdate(
            final String previousStatus,
            final WaitingStatus currentStatus
    ) {
        return !"NONE".equals(resolveSection(previousStatus))
                || !"NONE".equals(resolveSection(currentStatus));
    }

    private String resolveOperation(final String previousSection, final String currentSection) {
        if ("NONE".equals(previousSection) && !"NONE".equals(currentSection)) {
            return "UPSERT";
        }

        if (!"NONE".equals(previousSection) && "NONE".equals(currentSection)) {
            return "REMOVE";
        }

        if (!previousSection.equals(currentSection)) {
            return "MOVE";
        }

        return "UPSERT";
    }

    private String resolveSection(final String status) {
        if (status == null) {
            return "NONE";
        }

        return switch (status) {
            case "CALLED", "REGISTERED" -> "FRONT_QUEUE";
            case "ENTERED" -> "IN_USE";
            default -> "NONE";
        };
    }

    private String resolveSection(final WaitingStatus currentStatus) {
        return resolveSection(currentStatus.name());
    }
}
