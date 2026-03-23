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
        if (message.eventType().isSseTarget()) {
            waitingEventPublisher.publish(WaitingEventChannel.SSE, message);
        }

        if (message.eventType().isFcmTarget()) {
            waitingEventPublisher.publish(WaitingEventChannel.FCM, message);
        }
    }
}
