package com.freeline.common.event.waiting.dispatcher;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.context.ApplicationEventPublisher;

import com.freeline.common.event.waiting.detector.WaitingStatusChangeCommand;
import com.freeline.common.event.waiting.detector.WaitingStatusChangeDetector;
import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventType;

class WaitingEventDispatcherTest {

    private static final LocalDateTime FIXED_OCCURRED_AT = LocalDateTime.of(2026, 3, 24, 15, 0);

    private final WaitingStatusChangeDetector waitingStatusChangeDetector =
            Mockito.mock(WaitingStatusChangeDetector.class);
    private final ApplicationEventPublisher applicationEventPublisher =
            Mockito.mock(ApplicationEventPublisher.class);
    private final WaitingEventDispatcher waitingEventDispatcher =
            new WaitingEventDispatcher(waitingStatusChangeDetector, applicationEventPublisher);

    @Test
    @DisplayName("감지된 이벤트가 있으면 내부 이벤트로 발행한다")
    void 감지된_이벤트가_있으면_내부_이벤트로_발행한다() {
        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_CALLED,
                1L,
                2L,
                3L,
                "WAITING",
                "CALLED"
        );
        final WaitingEventMessage message = WaitingEventMessage.builder()
                .schemaVersion(1)
                .eventId(UUID.randomUUID())
                .eventType(WaitingEventType.WAITING_CALLED)
                .waitingId(1L)
                .boothId(2L)
                .visitorId(3L)
                .previousStatus("WAITING")
                .currentStatus("CALLED")
                .occurredAt(FIXED_OCCURRED_AT)
                .snapshot(null)
                .build();

        Mockito.when(waitingStatusChangeDetector.detect(command))
                .thenReturn(Optional.of(message));

        waitingEventDispatcher.dispatch(command);

        final ArgumentCaptor<WaitingEventMessage> captor = ArgumentCaptor.forClass(WaitingEventMessage.class);
        Mockito.verify(applicationEventPublisher).publishEvent(captor.capture());
        Assertions.assertThat(captor.getValue()).isEqualTo(message);
    }

    @Test
    @DisplayName("감지된 이벤트가 없으면 내부 이벤트를 발행하지 않는다")
    void 감지된_이벤트가_없으면_내부_이벤트를_발행하지_않는다() {
        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_CALLED,
                1L,
                2L,
                3L,
                "CALLED",
                "CALLED"
        );

        Mockito.when(waitingStatusChangeDetector.detect(command))
                .thenReturn(Optional.empty());

        waitingEventDispatcher.dispatch(command);

        Mockito.verify(applicationEventPublisher, Mockito.never()).publishEvent(Mockito.any(Object.class));
    }
}
