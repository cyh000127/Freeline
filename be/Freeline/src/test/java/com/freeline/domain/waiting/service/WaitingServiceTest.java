package com.freeline.domain.waiting.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.waiting.dto.response.VisitorWaitingListResDto;
import com.freeline.domain.waiting.dto.response.WaitingCreateResDto;
import com.freeline.domain.waiting.dto.response.WaitingExpectedTimeResDto;
import com.freeline.domain.waiting.exception.WaitingException;

@ExtendWith(MockitoExtension.class)
class WaitingServiceTest {

    private static final List<WaitingStatus> ACTIVE_WAITING_STATUSES = List.of(
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED,
            WaitingStatus.ENTERED
    );

    private static final List<WaitingStatus> RANKED_WAITING_STATUSES = List.of(
            WaitingStatus.WAITING,
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED
    );

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private BoothPolicyRepository boothPolicyRepository;

    @InjectMocks
    private WaitingService waitingService;

    @Test
    void createWaiting_success() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(3L)
                .name("굿즈 부스")
                .build();
        final BoothWaiting savedWaiting = BoothWaiting.builder()
                .id(301L)
                .boothId(12L)
                .visitorId(21L)
                .status(WaitingStatus.WAITING)
                .waitingNumber(4)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 13, 10, 0))
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.existsByVisitorIdAndBoothIdAndStatusIn(
                21L,
                12L,
                ACTIVE_WAITING_STATUSES
        )).thenReturn(false);
        Mockito.when(boothWaitingRepository.countByVisitorIdAndStatusIn(21L, ACTIVE_WAITING_STATUSES)).thenReturn(1L);
        Mockito.when(boothWaitingRepository.findTopByBoothIdOrderByWaitingNumberDesc(12L)).thenReturn(Optional.of(
                BoothWaiting.builder()
                        .id(300L)
                        .boothId(12L)
                        .visitorId(19L)
                        .status(WaitingStatus.WAITING)
                        .waitingNumber(3)
                        .deferCount(0)
                        .requestedAt(LocalDateTime.of(2026, 3, 13, 9, 55))
                        .build()
        ));
        Mockito.when(boothWaitingRepository.save(ArgumentMatchers.any(BoothWaiting.class))).thenReturn(savedWaiting);
        Mockito.when(boothWaitingRepository.findAllByVisitorIdAndStatusInOrderByRequestedAtAsc(
                21L,
                ACTIVE_WAITING_STATUSES
        )).thenReturn(List.of(savedWaiting));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusInAndWaitingNumberLessThan(
                12L,
                RANKED_WAITING_STATUSES,
                4
        )).thenReturn(3L);

        final WaitingCreateResDto result = waitingService.createWaiting(12L, 21L);

        Assertions.assertThat(result.waitingId()).isEqualTo(301L);
        Assertions.assertThat(result.waitingNum()).isEqualTo(4);
        Assertions.assertThat(result.currentRank()).isEqualTo(4);
        Assertions.assertThat(result.status()).isEqualTo("WAITING");
        Assertions.assertThat(result.visitorQueueStatus()).isEqualTo("FREE");
    }

    @Test
    void createWaiting_fail_whenAlreadyWaitingAtSameBooth() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(3L)
                .name("굿즈 부스")
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.existsByVisitorIdAndBoothIdAndStatusIn(
                21L,
                12L,
                ACTIVE_WAITING_STATUSES
        )).thenReturn(true);

        Assertions.assertThatThrownBy(() -> waitingService.createWaiting(12L, 21L))
                .isInstanceOf(WaitingException.class)
                .hasMessage("이미 해당 부스에 진행 중인 대기가 존재합니다.");

        Mockito.verify(boothWaitingRepository, Mockito.never()).countByVisitorIdAndStatusIn(
                ArgumentMatchers.anyLong(),
                ArgumentMatchers.anyCollection()
        );
    }

    @Test
    void createWaiting_fail_whenActiveWaitingLimitExceeded() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(3L)
                .name("굿즈 부스")
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.existsByVisitorIdAndBoothIdAndStatusIn(
                21L,
                12L,
                ACTIVE_WAITING_STATUSES
        )).thenReturn(false);
        Mockito.when(boothWaitingRepository.countByVisitorIdAndStatusIn(21L, ACTIVE_WAITING_STATUSES)).thenReturn(3L);

        Assertions.assertThatThrownBy(() -> waitingService.createWaiting(12L, 21L))
                .isInstanceOf(WaitingException.class)
                .hasMessage("최대 활성 대기 개수(3개)를 초과할 수 없습니다.");
    }

    @Test
    void getMyWaitings_success() {
        final Booth goodsBooth = Booth.builder()
                .id(12L)
                .eventId(3L)
                .name("굿즈 부스")
                .build();
        final Booth foodBooth = Booth.builder()
                .id(14L)
                .eventId(3L)
                .name("푸드 부스")
                .build();
        final BoothWaiting waiting = BoothWaiting.builder()
                .id(301L)
                .boothId(12L)
                .booth(goodsBooth)
                .visitorId(21L)
                .status(WaitingStatus.WAITING)
                .waitingNumber(8)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 13, 10, 0))
                .build();
        final BoothWaiting called = BoothWaiting.builder()
                .id(302L)
                .boothId(14L)
                .booth(foodBooth)
                .visitorId(21L)
                .status(WaitingStatus.CALLED)
                .waitingNumber(2)
                .deferCount(0)
                .requestedAt(LocalDateTime.of(2026, 3, 13, 10, 1))
                .build();

        Mockito.when(boothWaitingRepository.findAllByVisitorIdAndStatusInOrderByRequestedAtAsc(
                21L,
                ACTIVE_WAITING_STATUSES
        )).thenReturn(List.of(waiting, called));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusInAndWaitingNumberLessThan(
                12L,
                RANKED_WAITING_STATUSES,
                8
        )).thenReturn(4L);
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusInAndWaitingNumberLessThan(
                14L,
                RANKED_WAITING_STATUSES,
                2
        )).thenReturn(1L);
        Mockito.when(boothPolicyRepository.findByBoothId(14L)).thenReturn(Optional.of(
                BoothPolicy.builder()
                        .id(1L)
                        .boothId(14L)
                        .deferLimit(2)
                        .build()
        ));

        final VisitorWaitingListResDto result = waitingService.getMyWaitings(21L);

        Assertions.assertThat(result.visitorQueueStatus()).isEqualTo("FRONT_QUEUE_OCCUPIED");
        Assertions.assertThat(result.waitings()).hasSize(2);
        Assertions.assertThat(result.waitings().get(0).boothName()).isEqualTo("굿즈 부스");
        Assertions.assertThat(result.waitings().get(0).myRank()).isEqualTo(5);
        Assertions.assertThat(result.waitings().get(1).myRank()).isEqualTo(2);
        Assertions.assertThat(result.waitings().get(1).postponeAvailable()).isTrue();
    }

    @Test
    void getExpectedWaitingTime_success() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(3L)
                .name("굿즈 부스")
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatus(12L, WaitingStatus.WAITING)).thenReturn(7L);
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(
                BoothPolicy.builder()
                        .id(1L)
                        .boothId(12L)
                        .stayTime(600)
                        .build()
        ));

        final WaitingExpectedTimeResDto result = waitingService.getExpectedWaitingTime(12L);

        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.currentRank()).isEqualTo(7);
        Assertions.assertThat(result.avgStayTime()).isEqualTo(10);
        Assertions.assertThat(result.estimatedMinutes()).isEqualTo(70);
    }

    @Test
    void getExpectedWaitingTime_fail_whenBoothMissing() {
        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> waitingService.getExpectedWaitingTime(12L))
                .isInstanceOf(BoothException.class)
                .hasMessage("존재하지 않는 부스입니다.");
    }
}
