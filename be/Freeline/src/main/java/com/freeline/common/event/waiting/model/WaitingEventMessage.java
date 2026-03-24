package com.freeline.common.event.waiting.model;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;

@Builder
public record WaitingEventMessage(
        UUID eventId,
        WaitingEventType eventType,
        Long waitingId,
        Long boothId,
        Long visitorId,
        String previousStatus,
        String currentStatus,
        LocalDateTime occurredAt
) {
}
