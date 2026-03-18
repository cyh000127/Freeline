package com.freeline.domain.boothmanager.converter;

import java.time.LocalDateTime;
import java.util.List;

import lombok.experimental.UtilityClass;

import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.boothmanager.dto.response.BoothManagerBoothResDto;
import com.freeline.domain.boothmanager.dto.response.BoothManagerDashboardResDto;
import com.freeline.domain.boothmanager.dto.response.BoothManagerSseEventResDto;
import com.freeline.domain.boothmanager.dto.response.BoothManagerSummaryResDto;
import com.freeline.domain.boothmanager.dto.response.BoothManagerWaitingItemResDto;

@UtilityClass
public class BoothManagerConverter {

    public BoothManagerBoothResDto toBoothResDto(final Booth booth) {
        return BoothManagerBoothResDto.builder()
                .boothId(booth.getId())
                .boothName(booth.getName())
                .locationCode(booth.getLocationCode())
                .emergencyClosed(booth.isEmergencyClosed())
                .build();
    }

    public BoothManagerWaitingItemResDto toWaitingItemResDto(final BoothWaiting waiting) {
        return BoothManagerWaitingItemResDto.builder()
                .waitingId(waiting.getId())
                .waitingNumber(waiting.getWaitingNumber())
                .visitorName(waiting.getVisitor() != null ? waiting.getVisitor().getName() : null)
                .status(waiting.getStatus().name())
                .arrivalChecked(waiting.getStatus() == WaitingStatus.REGISTERED)
                .calledAt(waiting.getCalledAt())
                .registeredAt(waiting.getRegisteredAt())
                .enteredAt(waiting.getEnteredAt())
                .build();
    }

    public BoothManagerSummaryResDto toSummaryResDto(
            final int totalActiveCount,
            final int waitingCount,
            final int frontQueueCount,
            final int inUseCount,
            final int blockedByOtherBoothCount
    ) {
        return BoothManagerSummaryResDto.builder()
                .totalActiveCount(totalActiveCount)
                .waitingCount(waitingCount)
                .frontQueueCount(frontQueueCount)
                .inUseCount(inUseCount)
                .blockedByOtherBoothCount(blockedByOtherBoothCount)
                .build();
    }

    public BoothManagerDashboardResDto toDashboardResDto(
            final Booth booth,
            final BoothManagerSummaryResDto summary,
            final List<BoothManagerWaitingItemResDto> frontQueue,
            final List<BoothManagerWaitingItemResDto> inUse
    ) {
        return BoothManagerDashboardResDto.builder()
                .booth(toBoothResDto(booth))
                .summary(summary)
                .frontQueue(frontQueue)
                .inUse(inUse)
                .build();
    }

    public BoothManagerSseEventResDto toSseEventResDto(
            final String eventType,
            final Long boothId,
            final Long waitingId,
            final WaitingStatus changedStatus,
            final LocalDateTime occurredAt
    ) {
        return toSseEventResDto(eventType, boothId, waitingId, changedStatus != null ? changedStatus.name() : null, occurredAt);
    }

    public BoothManagerSseEventResDto toSseEventResDto(
            final String eventType,
            final Long boothId,
            final Long waitingId,
            final String changedStatus,
            final LocalDateTime occurredAt
    ) {
        return BoothManagerSseEventResDto.builder()
                .eventType(eventType)
                .boothId(boothId)
                .waitingId(waitingId)
                .changedStatus(changedStatus)
                .occurredAt(occurredAt)
                .build();
    }

    public BoothManagerSseEventResDto toConnectedEventResDto(final Long boothId, final LocalDateTime occurredAt) {
        return BoothManagerSseEventResDto.builder()
                .eventType("CONNECTED")
                .boothId(boothId)
                .waitingId(null)
                .changedStatus(null)
                .occurredAt(occurredAt)
                .build();
    }
}
