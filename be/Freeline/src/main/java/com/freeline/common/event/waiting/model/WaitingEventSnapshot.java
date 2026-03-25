package com.freeline.common.event.waiting.model;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record WaitingEventSnapshot(
        Long waitingId,
        Integer waitingNumber,
        Long visitorId,
        String visitorName,
        String status,
        Boolean arrivalChecked,
        LocalDateTime calledAt,
        LocalDateTime registeredAt,
        LocalDateTime enteredAt
) {
}
