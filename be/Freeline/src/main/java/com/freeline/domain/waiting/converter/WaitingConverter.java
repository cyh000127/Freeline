package com.freeline.domain.waiting.converter;

import java.time.LocalDateTime;
import java.util.List;

import lombok.experimental.UtilityClass;

import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.VisitorQueueStatus;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.waiting.dto.response.VisitorWaitingListResDto;
import com.freeline.domain.waiting.dto.response.VisitorWaitingResDto;
import com.freeline.domain.waiting.dto.response.WaitingAdmitResDto;
import com.freeline.domain.waiting.dto.response.WaitingCallResDto;
import com.freeline.domain.waiting.dto.response.WaitingCreateResDto;
import com.freeline.domain.waiting.dto.response.WaitingDashboardResDto;
import com.freeline.domain.waiting.dto.response.WaitingExitResDto;
import com.freeline.domain.waiting.dto.response.WaitingExpectedTimeResDto;
import com.freeline.domain.waiting.dto.response.WaitingPostponeResDto;
import com.freeline.domain.waiting.dto.response.WaitingQueueItemDto;

@UtilityClass
public class WaitingConverter {

    public BoothWaiting toEntity(
            final Long boothId,
            final Long visitorId,
            final Integer waitingNumber,
            final LocalDateTime requestedAt
    ) {
        return BoothWaiting.builder()
                .boothId(boothId)
                .visitorId(visitorId)
                .status(WaitingStatus.WAITING)
                .waitingNumber(waitingNumber)
                .deferCount(0)
                .requestedAt(requestedAt)
                .build();
    }

    public WaitingCreateResDto toWaitingCreateResDto(
            final BoothWaiting waiting,
            final int currentRank,
            final VisitorQueueStatus visitorQueueStatus
    ) {
        return WaitingCreateResDto.builder()
                .waitingId(waiting.getId())
                .waitingNum(waiting.getWaitingNumber())
                .currentRank(currentRank)
                .status(waiting.getStatus().name())
                .visitorQueueStatus(visitorQueueStatus.name())
                .build();
    }

    public VisitorWaitingResDto toVisitorWaitingResDto(
            final BoothWaiting waiting,
            final int myRank,
            final boolean postponeAvailable
    ) {
        return VisitorWaitingResDto.builder()
                .waitingId(waiting.getId())
                .boothName(waiting.getBooth() != null ? waiting.getBooth().getName() : null)
                .status(waiting.getStatus().name())
                .myRank(myRank)
                .postponeAvailable(postponeAvailable)
                .build();
    }

    public VisitorWaitingListResDto toVisitorWaitingListResDto(
            final VisitorQueueStatus visitorQueueStatus,
            final List<VisitorWaitingResDto> waitings
    ) {
        return VisitorWaitingListResDto.builder()
                .visitorQueueStatus(visitorQueueStatus.name())
                .waitings(waitings)
                .build();
    }

    public WaitingExpectedTimeResDto toWaitingExpectedTimeResDto(
            final Long boothId,
            final int currentRank,
            final int estimatedMinutes,
            final int avgStayTime
    ) {
        return WaitingExpectedTimeResDto.builder()
                .boothId(boothId)
                .currentRank(currentRank)
                .estimatedMinutes(estimatedMinutes)
                .avgStayTime(avgStayTime)
                .build();
    }

    public WaitingPostponeResDto toWaitingPostponeResDto(
            final BoothWaiting waiting,
            final int newRank,
            final int remainingPostponeCount
    ) {
        return WaitingPostponeResDto.builder()
                .waitingId(waiting.getId())
                .newRank(newRank)
                .remainingPostponeCount(remainingPostponeCount)
                .build();
    }

    public WaitingExitResDto toWaitingExitResDto(final BoothWaiting waiting) {
        return WaitingExitResDto.builder()
                .waitingId(waiting.getId())
                .status(waiting.getStatus().name())
                .exitedAt(waiting.getExitedAt())
                .build();
    }

    public WaitingCallResDto toWaitingCallResDto(final List<BoothWaiting> calledWaitings) {
        final BoothWaiting firstWaiting = calledWaitings.getFirst();

        return WaitingCallResDto.builder()
                .waitingId(firstWaiting.getId())
                .waitingNum(firstWaiting.getWaitingNumber())
                .status(firstWaiting.getStatus().name())
                .calledAt(firstWaiting.getCalledAt())
                .expiresAt(firstWaiting.getCallExpiresAt())
                .calledCount(calledWaitings.size())
                .waitingIds(calledWaitings.stream()
                        .map(BoothWaiting::getId)
                        .toList())
                .build();
    }

    public WaitingAdmitResDto toWaitingAdmitResDto(final BoothWaiting waiting) {
        return WaitingAdmitResDto.builder()
                .waitingId(waiting.getId())
                .status(waiting.getStatus().name())
                .enteredAt(waiting.getEnteredAt())
                .build();
    }

    public WaitingQueueItemDto toWaitingQueueItemDto(final BoothWaiting waiting) {
        return WaitingQueueItemDto.builder()
                .waitingId(waiting.getId())
                .waitingNumber(waiting.getWaitingNumber())
                .visitorName(waiting.getVisitor() != null ? waiting.getVisitor().getName() : null)
                .status(waiting.getStatus().name())
                .deferCount(waiting.getDeferCount())
                .calledAt(waiting.getCalledAt())
                .build();
    }

    public WaitingDashboardResDto toWaitingDashboardResDto(
            final Long boothId,
            final List<WaitingQueueItemDto> queueList
    ) {
        return WaitingDashboardResDto.builder()
                .boothId(boothId)
                .totalWaitingCount(queueList.size())
                .queueList(queueList)
                .build();
    }
}
