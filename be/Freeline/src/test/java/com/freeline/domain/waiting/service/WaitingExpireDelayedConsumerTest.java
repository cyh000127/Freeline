package com.freeline.domain.waiting.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.waiting.dto.message.WaitingExpireTaskMessage;

@ExtendWith(MockitoExtension.class)
class WaitingExpireDelayedConsumerTest {

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private WaitingStatusPersistenceService waitingStatusPersistenceService;

    @Test
    void consume_success_whenWaitingIsCalled() {
        final WaitingExpireDelayedConsumer consumer =
                new WaitingExpireDelayedConsumer(boothWaitingRepository, waitingStatusPersistenceService);
        final LocalDateTime expiresAt = LocalDateTime.of(2026, 3, 25, 16, 30);
        final WaitingExpireTaskMessage message = WaitingExpireTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(301L)
                .expiresAt(expiresAt)
                .build();

        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(
                BoothWaiting.builder()
                        .id(301L)
                        .status(WaitingStatus.CALLED)
                        .build()
        ));

        consumer.consume(message);

        Mockito.verify(waitingStatusPersistenceService).expireWaiting(301L, expiresAt);
    }

    @Test
    void consume_skipsWhenPayloadIsMissing() {
        final WaitingExpireDelayedConsumer consumer =
                new WaitingExpireDelayedConsumer(boothWaitingRepository, waitingStatusPersistenceService);
        final WaitingExpireTaskMessage message = WaitingExpireTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(null)
                .expiresAt(null)
                .build();

        consumer.consume(message);

        Mockito.verifyNoInteractions(boothWaitingRepository, waitingStatusPersistenceService);
    }

    @Test
    void consume_skipsWhenWaitingIsMissing() {
        final WaitingExpireDelayedConsumer consumer =
                new WaitingExpireDelayedConsumer(boothWaitingRepository, waitingStatusPersistenceService);
        final WaitingExpireTaskMessage message = WaitingExpireTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(302L)
                .expiresAt(LocalDateTime.of(2026, 3, 25, 16, 30))
                .build();

        Mockito.when(boothWaitingRepository.findById(302L)).thenReturn(Optional.empty());

        consumer.consume(message);

        Mockito.verify(boothWaitingRepository).findById(302L);
        Mockito.verifyNoInteractions(waitingStatusPersistenceService);
    }

    @Test
    void consume_skipsWhenWaitingStatusIsStale() {
        final WaitingExpireDelayedConsumer consumer =
                new WaitingExpireDelayedConsumer(boothWaitingRepository, waitingStatusPersistenceService);
        final WaitingExpireTaskMessage message = WaitingExpireTaskMessage.builder()
                .eventId(UUID.randomUUID())
                .waitingId(303L)
                .expiresAt(LocalDateTime.of(2026, 3, 25, 16, 30))
                .build();

        Mockito.when(boothWaitingRepository.findById(303L)).thenReturn(Optional.of(
                BoothWaiting.builder()
                        .id(303L)
                        .status(WaitingStatus.REGISTERED)
                        .build()
        ));

        consumer.consume(message);

        Mockito.verify(boothWaitingRepository).findById(303L);
        Mockito.verifyNoInteractions(waitingStatusPersistenceService);
    }
}
