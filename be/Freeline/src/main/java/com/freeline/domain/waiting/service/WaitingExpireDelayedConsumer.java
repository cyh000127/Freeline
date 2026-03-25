package com.freeline.domain.waiting.service;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.waiting.dto.message.WaitingExpireTaskMessage;

@Slf4j
@Component
@RequiredArgsConstructor
public class WaitingExpireDelayedConsumer {

    private final BoothWaitingRepository boothWaitingRepository;
    private final WaitingStatusPersistenceService waitingStatusPersistenceService;

    @RabbitListener(
            queues = "${app.rabbitmq.waiting.expire-delayed-queue:waiting.expire.delayed.queue}",
            containerFactory = "waitingRabbitListenerContainerFactory"
    )
    public void consume(final WaitingExpireTaskMessage message) {
        if (message.waitingId() == null || message.expiresAt() == null) {
            log.warn(
                    "[Waiting] expire task skipped due to missing payload {eventId: {}, waitingId: {}, expiresAt: {}}",
                    message.eventId(),
                    message.waitingId(),
                    message.expiresAt()
            );
            return;
        }

        final var waiting = boothWaitingRepository.findById(message.waitingId())
                .orElseGet(() -> {
                    log.warn(
                            "[Waiting] expire task skipped because waiting was not found {eventId: {}, waitingId: {}}",
                            message.eventId(),
                            message.waitingId()
                    );
                    return null;
                });
        if (waiting == null) {
            return;
        }

        if (waiting.getStatus() != WaitingStatus.CALLED) {
            log.warn(
                    "[Waiting] expire task skipped due to stale status {eventId: {}, waitingId: {}, currentStatus: {}}",
                    message.eventId(),
                    message.waitingId(),
                    waiting.getStatus()
            );
            return;
        }

        waitingStatusPersistenceService.expireWaiting(message.waitingId(), message.expiresAt());
    }
}
