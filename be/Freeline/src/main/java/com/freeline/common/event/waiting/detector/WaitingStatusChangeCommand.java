package com.freeline.common.event.waiting.detector;

import com.freeline.common.event.waiting.model.WaitingEventType;

public record WaitingStatusChangeCommand(
        WaitingEventType eventType,
        Long waitingId,
        Long boothId,
        Long visitorId,
        String previousStatus,
        String currentStatus
) {
}
