package com.freeline.domain.boothmanager.converter;

import java.time.LocalDateTime;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import com.freeline.common.event.waiting.model.WaitingEventSnapshot;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.boothmanager.dto.response.BoothManagerWaitingItemResDto;

class BoothManagerConverterTest {

    @Test
    void toWaitingItemResDto_setsArrivalCheckedTrue_whenRegisteredAtExists() {
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(301L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.ENTERED)
                .waitingNumber(7)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 25, 10, 0))
                .registeredAt(LocalDateTime.of(2026, 3, 25, 10, 2))
                .enteredAt(LocalDateTime.of(2026, 3, 25, 10, 3))
                .build();

        final BoothManagerWaitingItemResDto result = BoothManagerConverter.toWaitingItemResDto(waiting);

        Assertions.assertThat(result.arrivalChecked()).isTrue();
    }

    @Test
    void toWaitingItemResDto_setsArrivalCheckedFromSnapshot() {
        final WaitingEventSnapshot snapshot = WaitingEventSnapshot.builder()
                .waitingId(301L)
                .waitingNumber(7)
                .visitorId(21L)
                .visitorName("김싸피")
                .status("ENTERED")
                .arrivalChecked(true)
                .calledAt(LocalDateTime.of(2026, 3, 25, 10, 1))
                .registeredAt(LocalDateTime.of(2026, 3, 25, 10, 2))
                .enteredAt(LocalDateTime.of(2026, 3, 25, 10, 3))
                .build();

        final BoothManagerWaitingItemResDto result = BoothManagerConverter.toWaitingItemResDto(snapshot);

        Assertions.assertThat(result.arrivalChecked()).isTrue();
    }
}
