package com.freeline.domain.boothmanager.service;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.domain.booth.entity.WaitingStatus;

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

        boothManagerSseService.publishQueueUpdated(
                message.boothId(),
                message.waitingId(),
                waitingStatus
        );
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
}
