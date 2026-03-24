package com.freeline.domain.waiting.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.event.waiting.dispatcher.WaitingEventDispatcher;
import com.freeline.common.util.TimeUtils;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.Visitor;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.waiting.assembler.WaitingEventSnapshotAssembler;
import com.freeline.domain.waiting.dto.response.VisitorWaitingListResDto;
import com.freeline.domain.waiting.dto.response.WaitingAdmitResDto;
import com.freeline.domain.waiting.dto.response.WaitingCallResDto;
import com.freeline.domain.waiting.dto.response.WaitingCreateResDto;
import com.freeline.domain.waiting.dto.response.WaitingDashboardResDto;
import com.freeline.domain.waiting.dto.response.WaitingExitResDto;
import com.freeline.domain.waiting.dto.response.WaitingExpectedTimeResDto;
import com.freeline.domain.waiting.dto.response.WaitingPostponeResDto;
import com.freeline.domain.waiting.exception.WaitingException;

@ExtendWith(MockitoExtension.class)
class WaitingServiceTest {

    private static final LocalDateTime FIXED_NOW = LocalDateTime.of(2026, 3, 19, 18, 0);

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

    private static final List<WaitingStatus> OTHER_BOOTH_FRONT_QUEUE_STATUSES = List.of(
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED,
            WaitingStatus.ENTERED
    );

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private BoothPolicyRepository boothPolicyRepository;

    @Mock
    private WaitingEventDispatcher waitingEventDispatcher;

    @Spy
    private WaitingEventSnapshotAssembler waitingEventSnapshotAssembler;

    @InjectMocks
    private WaitingService waitingService;

    private MockedStatic<TimeUtils> timeUtilsMock;

    @BeforeEach
    void setUp() {
        timeUtilsMock = Mockito.mockStatic(TimeUtils.class);
        timeUtilsMock.when(TimeUtils::nowDateTime).thenReturn(FIXED_NOW);
        timeUtilsMock.when(TimeUtils::today).thenReturn(FIXED_NOW.toLocalDate());
        timeUtilsMock.when(TimeUtils::nowTime).thenReturn(FIXED_NOW.toLocalTime());
    }

    @AfterEach
    void tearDown() {
        timeUtilsMock.close();
    }

    @Test
    void createWaiting_success() {
        final Booth booth = createBooth(12L, "Goods Booth");
        final BoothWaiting savedWaiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 4, 0, null);

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.existsByVisitorIdAndBoothIdAndStatusIn(
                21L,
                12L,
                ACTIVE_WAITING_STATUSES
        )).thenReturn(false);
        Mockito.when(boothWaitingRepository.countByVisitorIdAndStatusIn(21L, ACTIVE_WAITING_STATUSES)).thenReturn(1L);
        Mockito.when(boothWaitingRepository.findTopByBoothIdOrderByWaitingNumberDesc(12L)).thenReturn(Optional.of(
                createWaiting(300L, 12L, 19L, WaitingStatus.WAITING, 3, 0, null)
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
        final Booth booth = createBooth(12L, "Goods Booth");

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.existsByVisitorIdAndBoothIdAndStatusIn(
                21L,
                12L,
                ACTIVE_WAITING_STATUSES
        )).thenReturn(true);

        Assertions.assertThatThrownBy(() -> waitingService.createWaiting(12L, 21L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.ALREADY_WAITING_FOR_BOOTH.getMessage());

        Mockito.verify(boothWaitingRepository, Mockito.never()).countByVisitorIdAndStatusIn(
                ArgumentMatchers.anyLong(),
                ArgumentMatchers.anyCollection()
        );
    }

    @Test
    void createWaiting_fail_whenActiveWaitingLimitExceeded() {
        final Booth booth = createBooth(12L, "Goods Booth");

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.existsByVisitorIdAndBoothIdAndStatusIn(
                21L,
                12L,
                ACTIVE_WAITING_STATUSES
        )).thenReturn(false);
        Mockito.when(boothWaitingRepository.countByVisitorIdAndStatusIn(21L, ACTIVE_WAITING_STATUSES)).thenReturn(3L);

        Assertions.assertThatThrownBy(() -> waitingService.createWaiting(12L, 21L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.MAX_WAITING_EXCEEDED.getMessage());
    }

    @Test
    void callNextWaiting_success_skipsVisitorInFrontQueueAtOtherBooth() {
        final Booth booth = createBooth(12L, "Goods Booth");
        final BoothWaiting firstWaiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 1, 0, null);
        final BoothWaiting secondWaiting = createWaiting(302L, 12L, 22L, WaitingStatus.WAITING, 2, 0, null);

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.findAllByBoothIdAndStatusInOrderByWaitingNumberAsc(
                12L,
                List.of(WaitingStatus.WAITING)
        )).thenReturn(List.of(firstWaiting, secondWaiting));
        Mockito.when(boothWaitingRepository.existsByVisitorIdAndBoothIdNotAndStatusIn(
                21L,
                12L,
                OTHER_BOOTH_FRONT_QUEUE_STATUSES
        )).thenReturn(true);
        Mockito.when(boothWaitingRepository.existsByVisitorIdAndBoothIdNotAndStatusIn(
                22L,
                12L,
                OTHER_BOOTH_FRONT_QUEUE_STATUSES
        )).thenReturn(false);
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(
                BoothPolicy.builder()
                        .id(1L)
                        .boothId(12L)
                        .callValidTime(180)
                        .build()
        ));

        final WaitingCallResDto result = waitingService.callNextWaiting(12L);

        Assertions.assertThat(firstWaiting.getStatus()).isEqualTo(WaitingStatus.WAITING);
        Assertions.assertThat(secondWaiting.getStatus()).isEqualTo(WaitingStatus.CALLED);
        Assertions.assertThat(secondWaiting.getCalledAt()).isNotNull();
        Assertions.assertThat(secondWaiting.getCallExpiresAt()).isNotNull();
        Assertions.assertThat(secondWaiting.getCallExpiresAt()).isAfter(secondWaiting.getCalledAt());
        Assertions.assertThat(result.waitingId()).isEqualTo(302L);
        Assertions.assertThat(result.waitingNum()).isEqualTo(2);
        Assertions.assertThat(result.status()).isEqualTo("CALLED");
    }

    @Test
    void callNextWaiting_fail_whenCandidateNotFound() {
        final Booth booth = createBooth(12L, "Goods Booth");

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.findAllByBoothIdAndStatusInOrderByWaitingNumberAsc(
                12L,
                List.of(WaitingStatus.WAITING)
        )).thenReturn(List.of());

        Assertions.assertThatThrownBy(() -> waitingService.callNextWaiting(12L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.CALL_CANDIDATE_NOT_FOUND.getMessage());
    }

    @Test
    void cancelWaiting_success() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        waitingService.cancelWaiting(301L, 21L);

        Assertions.assertThat(waiting.getStatus()).isEqualTo(WaitingStatus.CANCELED);
        Assertions.assertThat(waiting.getExitedAt()).isNotNull();
    }

    @Test
    void cancelWaiting_fail_whenAccessDenied() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 22L, WaitingStatus.WAITING, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        Assertions.assertThatThrownBy(() -> waitingService.cancelWaiting(301L, 21L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.WAITING_ACCESS_DENIED.getMessage());
    }

    @Test
    void cancelWaiting_fail_whenStatusAlreadyClosed() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.EXITED, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        Assertions.assertThatThrownBy(() -> waitingService.cancelWaiting(301L, 21L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.INVALID_WAITING_STATUS_FOR_CANCEL.getMessage());
    }

    @Test
    void cancelWaitingByAdmin_success() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.CALLED, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        waitingService.cancelWaitingByAdmin(301L, 12L);

        Assertions.assertThat(waiting.getStatus()).isEqualTo(WaitingStatus.CANCELED);
        Assertions.assertThat(waiting.getExitedAt()).isNotNull();
    }

    @Test
    void cancelWaitingByAdmin_fail_whenInvalidStatus() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.ENTERED, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        Assertions.assertThatThrownBy(() -> waitingService.cancelWaitingByAdmin(301L, 12L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.INVALID_WAITING_STATUS_FOR_CANCEL.getMessage());
    }

    @Test
    void postponeWaiting_success() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 3, 0, null);
        final BoothWaiting nextWaiting = createWaiting(302L, 12L, 22L, WaitingStatus.WAITING, 4, 0, null);

        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(
                BoothPolicy.builder()
                        .id(1L)
                        .boothId(12L)
                        .deferLimit(2)
                        .build()
        ));
        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndStatusAndWaitingNumberGreaterThanOrderByWaitingNumberAsc(
                12L,
                WaitingStatus.WAITING,
                3
        )).thenReturn(Optional.of(nextWaiting));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusInAndWaitingNumberLessThan(
                12L,
                RANKED_WAITING_STATUSES,
                4
        )).thenReturn(3L);

        final WaitingPostponeResDto result = waitingService.postponeWaiting(301L, 21L);

        Assertions.assertThat(waiting.getWaitingNumber()).isEqualTo(4);
        Assertions.assertThat(nextWaiting.getWaitingNumber()).isEqualTo(3);
        Assertions.assertThat(waiting.getDeferCount()).isEqualTo(1);
        Assertions.assertThat(result.waitingId()).isEqualTo(301L);
        Assertions.assertThat(result.newRank()).isEqualTo(4);
        Assertions.assertThat(result.remainingPostponeCount()).isEqualTo(1);
    }

    @Test
    void postponeWaiting_fail_whenLastInLine() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 3, 0, null);

        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(
                BoothPolicy.builder()
                        .id(1L)
                        .boothId(12L)
                        .deferLimit(2)
                        .build()
        ));
        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndStatusAndWaitingNumberGreaterThanOrderByWaitingNumberAsc(
                12L,
                WaitingStatus.WAITING,
                3
        )).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> waitingService.postponeWaiting(301L, 21L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.CANNOT_POSTPONE_LAST_IN_LINE.getMessage());
    }

    @Test
    void postponeWaiting_fail_whenLimitExceeded() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 3, 2, null);

        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(
                BoothPolicy.builder()
                        .id(1L)
                        .boothId(12L)
                        .deferLimit(2)
                        .build()
        ));

        Assertions.assertThatThrownBy(() -> waitingService.postponeWaiting(301L, 21L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.POSTPONE_LIMIT_EXCEEDED.getMessage());

        Mockito.verify(boothWaitingRepository, Mockito.never())
                .findFirstByBoothIdAndStatusAndWaitingNumberGreaterThanOrderByWaitingNumberAsc(
                        ArgumentMatchers.anyLong(),
                        ArgumentMatchers.any(),
                        ArgumentMatchers.anyInt()
                );
    }

    @Test
    void admitWaiting_success_whenRegistered() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.REGISTERED, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        final WaitingAdmitResDto result = waitingService.admitWaiting(301L, 12L);

        Assertions.assertThat(waiting.getStatus()).isEqualTo(WaitingStatus.ENTERED);
        Assertions.assertThat(waiting.getEnteredAt()).isNotNull();
        Assertions.assertThat(result.waitingId()).isEqualTo(301L);
        Assertions.assertThat(result.status()).isEqualTo("ENTERED");
        Assertions.assertThat(result.enteredAt()).isNotNull();
    }

    @Test
    void admitWaiting_fail_whenStatusIsWaiting() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        Assertions.assertThatThrownBy(() -> waitingService.admitWaiting(301L, 12L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.INVALID_STATUS_FOR_ADMIT.getMessage());
    }

    @Test
    void admitWaiting_fail_whenStatusIsCalled() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.CALLED, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        Assertions.assertThatThrownBy(() -> waitingService.admitWaiting(301L, 12L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.INVALID_STATUS_FOR_ADMIT.getMessage());
    }

    @Test
    void exitWaiting_success() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.ENTERED, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        final WaitingExitResDto result = waitingService.exitWaiting(301L, 21L);

        Assertions.assertThat(waiting.getStatus()).isEqualTo(WaitingStatus.EXITED);
        Assertions.assertThat(waiting.getExitedAt()).isNotNull();
        Assertions.assertThat(result.waitingId()).isEqualTo(301L);
        Assertions.assertThat(result.status()).isEqualTo("EXITED");
        Assertions.assertThat(result.exitedAt()).isNotNull();
    }

    @Test
    void exitWaiting_fail_whenInvalidStatus() {
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 4, 0, null);
        Mockito.when(boothWaitingRepository.findById(301L)).thenReturn(Optional.of(waiting));

        Assertions.assertThatThrownBy(() -> waitingService.exitWaiting(301L, 21L))
                .isInstanceOf(WaitingException.class)
                .hasMessage(ErrorCode.INVALID_WAITING_STATUS_FOR_EXIT.getMessage());
    }

    @Test
    void getMyWaitings_success() {
        final Booth goodsBooth = createBooth(12L, "Goods Booth");
        final Booth foodBooth = createBooth(14L, "Food Booth");
        final BoothWaiting waiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 8, 0, goodsBooth);
        final BoothWaiting called = createWaiting(302L, 14L, 21L, WaitingStatus.CALLED, 2, 0, foodBooth);

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
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(
                BoothPolicy.builder()
                        .id(1L)
                        .boothId(12L)
                        .deferLimit(2)
                        .build()
        ));

        final VisitorWaitingListResDto result = waitingService.getMyWaitings(21L);

        Assertions.assertThat(result.visitorQueueStatus()).isEqualTo("FRONT_QUEUE_OCCUPIED");
        Assertions.assertThat(result.waitings()).hasSize(2);
        Assertions.assertThat(result.waitings().getFirst().boothName()).isEqualTo("Goods Booth");
        Assertions.assertThat(result.waitings().getFirst().myRank()).isEqualTo(5);
        Assertions.assertThat(result.waitings().getFirst().postponeAvailable()).isTrue();
        Assertions.assertThat(result.waitings().get(1).myRank()).isEqualTo(2);
        Assertions.assertThat(result.waitings().get(1).postponeAvailable()).isFalse();
    }

    @Test
    void getBoothQueueDashboard_success_returnsActiveWaitingsInOrder() {
        final Booth booth = createBooth(12L, "Goods Booth");
        final Visitor visitorOne = createVisitor(21L, "Kim");
        final Visitor visitorTwo = createVisitor(22L, "Lee");
        final Visitor visitorThree = createVisitor(23L, "Park");
        final BoothWaiting firstWaiting = createWaiting(301L, 12L, 21L, WaitingStatus.WAITING, 1, 0, null, visitorOne);
        final BoothWaiting secondWaiting = createWaiting(302L, 12L, 22L, WaitingStatus.CALLED, 2, 1, null, visitorTwo);
        final BoothWaiting thirdWaiting = createWaiting(303L, 12L, 23L, WaitingStatus.ENTERED, 3, 0, null, visitorThree);
        secondWaiting.updateCalledAt(LocalDateTime.of(2026, 3, 13, 10, 3));

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.findWithVisitorByBoothIdAndStatusInOrderByWaitingNumberAsc(
                12L,
                ACTIVE_WAITING_STATUSES
        )).thenReturn(List.of(firstWaiting, secondWaiting, thirdWaiting));

        final WaitingDashboardResDto result = waitingService.getBoothQueueDashboard(12L);

        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.totalWaitingCount()).isEqualTo(3);
        Assertions.assertThat(result.queueList()).hasSize(3);
        Assertions.assertThat(result.queueList().get(0).waitingId()).isEqualTo(301L);
        Assertions.assertThat(result.queueList().get(0).visitorName()).isEqualTo("Kim");
        Assertions.assertThat(result.queueList().get(1).waitingNumber()).isEqualTo(2);
        Assertions.assertThat(result.queueList().get(1).status()).isEqualTo("CALLED");
        Assertions.assertThat(result.queueList().get(1).deferCount()).isEqualTo(1);
        Assertions.assertThat(result.queueList().get(1).calledAt()).isEqualTo(LocalDateTime.of(2026, 3, 13, 10, 3));
        Assertions.assertThat(result.queueList().get(2).visitorName()).isEqualTo("Park");

        Mockito.verify(boothWaitingRepository)
                .findWithVisitorByBoothIdAndStatusInOrderByWaitingNumberAsc(12L, ACTIVE_WAITING_STATUSES);
    }

    @Test
    void getExpectedWaitingTime_success() {
        final Booth booth = createBooth(12L, "Goods Booth");

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
                .hasMessage(ErrorCode.BOOTH_NOT_FOUND.getMessage());
    }

    private Booth createBooth(final Long boothId, final String name) {
        return Booth.builder()
                .id(boothId)
                .eventId(3L)
                .name(name)
                .build();
    }

    private BoothWaiting createWaiting(
            final Long waitingId,
            final Long boothId,
            final Long visitorId,
            final WaitingStatus status,
            final int waitingNumber,
            final int deferCount,
            final Booth booth
    ) {
        return createWaiting(waitingId, boothId, visitorId, status, waitingNumber, deferCount, booth, null);
    }

    private BoothWaiting createWaiting(
            final Long waitingId,
            final Long boothId,
            final Long visitorId,
            final WaitingStatus status,
            final int waitingNumber,
            final int deferCount,
            final Booth booth,
            final Visitor visitor
    ) {
        return BoothWaiting.builder()
                .id(waitingId)
                .boothId(boothId)
                .booth(booth)
                .visitorId(visitorId)
                .visitor(visitor)
                .status(status)
                .waitingNumber(waitingNumber)
                .deferCount(deferCount)
                .requestedAt(LocalDateTime.of(2026, 3, 13, 10, 0))
                .build();
    }

    private Visitor createVisitor(final Long visitorId, final String name) {
        return Visitor.builder()
                .id(visitorId)
                .eventId(3L)
                .entryCode("ENTRY-" + visitorId)
                .name(name)
                .active(true)
                .build();
    }
}
