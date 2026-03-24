package com.freeline.common.event.waiting.publisher;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.freeline.common.event.waiting.model.WaitingEventChannel;
import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventType;

class WaitingEventPublishListenerTest {

    private static final LocalDateTime FIXED_OCCURRED_AT = LocalDateTime.of(2026, 3, 24, 15, 0);

    private final WaitingEventPublisher waitingEventPublisher = Mockito.mock(WaitingEventPublisher.class);
    private final WaitingEventPublishListener waitingEventPublishListener =
            new WaitingEventPublishListener(waitingEventPublisher);

    @Test
    @DisplayName("SSE와 FCM 대상 이벤트면 두 채널 모두 발행한다")
    void sse와_fcm_대상_이벤트면_두_채널_모두_발행한다() {
        final WaitingEventMessage message = createMessage(WaitingEventType.WAITING_CALLED);

        waitingEventPublishListener.handle(message);

        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.SSE, message);
        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.FCM, message);
    }

    @Test
    @DisplayName("SSE 대상 이벤트면 SSE 채널만 발행한다")
    void sse_대상_이벤트면_sse_채널만_발행한다() {
        final WaitingEventMessage message = createMessage(WaitingEventType.WAITING_REGISTERED);

        waitingEventPublishListener.handle(message);

        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.SSE, message);
        Mockito.verify(waitingEventPublisher, Mockito.never()).publish(WaitingEventChannel.FCM, message);
    }

    @Test
    @DisplayName("SSE와 FCM 대상 이벤트면 두 채널 모두 발행한다")
    void sse와_fcm_대상_이벤트면_두_채널_모두_발행한다_호출만료() {
        final WaitingEventMessage message = createMessage(WaitingEventType.WAITING_EXPIRED);

        waitingEventPublishListener.handle(message);

        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.SSE, message);
        Mockito.verify(waitingEventPublisher).publish(WaitingEventChannel.FCM, message);
    }

    private WaitingEventMessage createMessage(final WaitingEventType eventType) {
        return WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(eventType)
                .waitingId(1L)
                .boothId(2L)
                .visitorId(3L)
                .previousStatus("WAITING")
                .currentStatus("CALLED")
                .occurredAt(FIXED_OCCURRED_AT)
                .snapshot(null)
                .build();
    }
}
