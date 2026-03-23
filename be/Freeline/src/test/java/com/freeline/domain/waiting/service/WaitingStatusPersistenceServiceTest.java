package com.freeline.domain.waiting.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.common.event.waiting.detector.WaitingStatusChangeCommand;
import com.freeline.common.event.waiting.dispatcher.WaitingEventDispatcher;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothWaitingRepository;

@ExtendWith(MockitoExtension.class)
class WaitingStatusPersistenceServiceTest {

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private WaitingEventDispatcher waitingEventDispatcher;

    @InjectMocks
    private WaitingStatusPersistenceService waitingStatusPersistenceService;

    @Test
    void expireWaiting_success() {
        final LocalDateTime expiresAt = LocalDateTime.of(2026, 3, 23, 14, 30);
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(100L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.CALLED)
                .waitingNumber(7)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 23, 14, 0))
                .build();

        org.mockito.Mockito.when(boothWaitingRepository.findById(100L)).thenReturn(Optional.of(waiting));

        final boolean result = waitingStatusPersistenceService.expireWaiting(100L, expiresAt);

        Assertions.assertThat(result).isTrue();
        Assertions.assertThat(waiting.getStatus()).isEqualTo(WaitingStatus.EXPIRED);
        Assertions.assertThat(waiting.getCallExpiresAt()).isEqualTo(expiresAt);

        final ArgumentCaptor<WaitingStatusChangeCommand> captor =
                ArgumentCaptor.forClass(WaitingStatusChangeCommand.class);
        org.mockito.Mockito.verify(waitingEventDispatcher).dispatch(captor.capture());
        Assertions.assertThat(captor.getValue().eventType().name()).isEqualTo("WAITING_EXPIRED");
        Assertions.assertThat(captor.getValue().previousStatus()).isEqualTo("CALLED");
        Assertions.assertThat(captor.getValue().currentStatus()).isEqualTo("EXPIRED");
    }

    @Test
    void expireWaiting_statusMismatch_skip() {
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(100L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.REGISTERED)
                .waitingNumber(7)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 23, 14, 0))
                .build();

        org.mockito.Mockito.when(boothWaitingRepository.findById(100L)).thenReturn(Optional.of(waiting));

        final boolean result = waitingStatusPersistenceService.expireWaiting(
                100L,
                LocalDateTime.of(2026, 3, 23, 14, 30)
        );

        Assertions.assertThat(result).isFalse();
        Assertions.assertThat(waiting.getStatus()).isEqualTo(WaitingStatus.REGISTERED);
        org.mockito.Mockito.verify(waitingEventDispatcher, org.mockito.Mockito.never()).dispatch(org.mockito.Mockito.any());
    }
}
