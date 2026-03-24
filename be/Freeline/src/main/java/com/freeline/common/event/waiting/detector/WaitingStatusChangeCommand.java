package com.freeline.common.event.waiting.detector;

import com.freeline.common.event.waiting.model.WaitingEventSnapshot;
import com.freeline.common.event.waiting.model.WaitingEventType;

public record WaitingStatusChangeCommand(
        WaitingEventType eventType,
        Long waitingId,
        Long boothId,
        Long visitorId,
        String previousStatus,
        String currentStatus,
        WaitingEventSnapshot snapshot
) {
    public WaitingStatusChangeCommand(
            final WaitingEventType eventType,
            final Long waitingId,
            final Long boothId,
            final Long visitorId,
            final String previousStatus,
            final String currentStatus
    ) {
        this(eventType, waitingId, boothId, visitorId, previousStatus, currentStatus, null);
    }
}
