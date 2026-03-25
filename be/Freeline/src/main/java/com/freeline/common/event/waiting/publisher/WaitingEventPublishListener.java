package com.freeline.common.event.waiting.publisher;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import lombok.RequiredArgsConstructor;

import com.freeline.common.event.waiting.model.WaitingEventChannel;
import com.freeline.common.event.waiting.model.WaitingEventMessage;

@Component
@RequiredArgsConstructor
public class WaitingEventPublishListener {

    private final WaitingEventPublisher waitingEventPublisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(final WaitingEventMessage message) {
        if (shouldPublishSse(message)) {
            waitingEventPublisher.publish(WaitingEventChannel.SSE, message);
        }

        if (message.eventType().isFcmTarget()) {
            waitingEventPublisher.publish(WaitingEventChannel.FCM, message);
        }
    }

    private boolean shouldPublishSse(final WaitingEventMessage message) {
        if (!message.eventType().isSseTarget()) {
            return false;
        }

        return !"NONE".equals(resolveSection(message.previousStatus()))
                || !"NONE".equals(resolveSection(message.currentStatus()));
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
}
