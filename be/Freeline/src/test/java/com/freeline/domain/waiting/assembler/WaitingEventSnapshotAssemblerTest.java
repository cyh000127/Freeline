package com.freeline.domain.waiting.assembler;

import java.time.LocalDateTime;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import com.freeline.common.event.waiting.model.WaitingEventSnapshot;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.Visitor;
import com.freeline.domain.booth.entity.WaitingStatus;

class WaitingEventSnapshotAssemblerTest {

    private final WaitingEventSnapshotAssembler assembler = new WaitingEventSnapshotAssembler();

    @Test
    void toSnapshot_success() {
        final LocalDateTime calledAt = LocalDateTime.of(2026, 3, 24, 14, 30);
        final LocalDateTime registeredAt = LocalDateTime.of(2026, 3, 24, 14, 31);
        final LocalDateTime enteredAt = LocalDateTime.of(2026, 3, 24, 14, 35);
        final Visitor visitor = Visitor.builder()
                .id(21L)
                .eventId(3L)
                .entryCode("ENTRY-21")
                .name("김싸피")
                .active(true)
                .build();
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(301L)
                .boothId(12L)
                .visitorId(21L)
                .visitor(visitor)
                .status(WaitingStatus.REGISTERED)
                .waitingNumber(7)
                .deferCount(1)
                .requestedAt(LocalDateTime.of(2026, 3, 24, 14, 0))
                .calledAt(calledAt)
                .registeredAt(registeredAt)
                .enteredAt(enteredAt)
                .build();

        final WaitingEventSnapshot snapshot = assembler.toSnapshot(waiting);

        Assertions.assertThat(snapshot.waitingId()).isEqualTo(301L);
        Assertions.assertThat(snapshot.waitingNumber()).isEqualTo(7);
        Assertions.assertThat(snapshot.visitorId()).isEqualTo(21L);
        Assertions.assertThat(snapshot.visitorName()).isEqualTo("김싸피");
        Assertions.assertThat(snapshot.status()).isEqualTo("REGISTERED");
        Assertions.assertThat(snapshot.arrivalChecked()).isTrue();
        Assertions.assertThat(snapshot.calledAt()).isEqualTo(calledAt);
        Assertions.assertThat(snapshot.registeredAt()).isEqualTo(registeredAt);
        Assertions.assertThat(snapshot.enteredAt()).isEqualTo(enteredAt);
    }
}
