package com.freeline.common.event.waiting.detector;

import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.event.waiting.model.WaitingEventType;

class WaitingStatusChangeDetectorTest {

    private final WaitingStatusChangeDetector waitingStatusChangeDetector =
            new WaitingStatusChangeDetector();

    @Test
    @DisplayName("상태가 변경되면 이벤트 메시지를 생성한다")
    void 상태가_변경되면_이벤트_메시지를_생성한다() {
        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_CALLED,
                1L,
                2L,
                3L,
                "WAITING",
                "CALLED"
        );

        final Optional<WaitingEventMessage> result = waitingStatusChangeDetector.detect(command);

        Assertions.assertThat(result).isPresent();
        Assertions.assertThat(result.get().eventId()).isNotNull();
        Assertions.assertThat(result.get().eventType()).isEqualTo(WaitingEventType.WAITING_CALLED);
        Assertions.assertThat(result.get().waitingId()).isEqualTo(1L);
        Assertions.assertThat(result.get().boothId()).isEqualTo(2L);
        Assertions.assertThat(result.get().visitorId()).isEqualTo(3L);
        Assertions.assertThat(result.get().previousStatus()).isEqualTo("WAITING");
        Assertions.assertThat(result.get().currentStatus()).isEqualTo("CALLED");
        Assertions.assertThat(result.get().occurredAt()).isNotNull();
    }

    @Test
    @DisplayName("상태가 변경되지 않으면 이벤트 메시지를 생성하지 않는다")
    void 상태가_변경되지_않으면_이벤트_메시지를_생성하지_않는다() {
        final WaitingStatusChangeCommand command = new WaitingStatusChangeCommand(
                WaitingEventType.WAITING_CALLED,
                1L,
                2L,
                3L,
                "CALLED",
                "CALLED"
        );

        final Optional<WaitingEventMessage> result = waitingStatusChangeDetector.detect(command);

        Assertions.assertThat(result).isEmpty();
    }
}
