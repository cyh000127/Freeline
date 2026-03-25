package com.freeline.common.event.waiting.detector;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.freeline.common.event.waiting.model.WaitingEventMessage;
import com.freeline.common.util.TimeUtils;

@Component
public class WaitingStatusChangeDetector {

    private static final int CURRENT_SCHEMA_VERSION = 1;

    public Optional<WaitingEventMessage> detect(final WaitingStatusChangeCommand command) {
        validate(command);

        if (command.previousStatus().equals(command.currentStatus())) {
            return Optional.empty();
        }

        return Optional.of(
                WaitingEventMessage.builder()
                        .schemaVersion(CURRENT_SCHEMA_VERSION)
                        .eventId(UUID.randomUUID())
                        .eventType(command.eventType())
                        .waitingId(command.waitingId())
                        .boothId(command.boothId())
                        .visitorId(command.visitorId())
                        .previousStatus(command.previousStatus())
                        .currentStatus(command.currentStatus())
                        .occurredAt(TimeUtils.nowDateTime())
                        .snapshot(command.snapshot())
                        .build()
        );
    }

    private void validate(final WaitingStatusChangeCommand command) {
        Objects.requireNonNull(command.eventType(), "eventType must not be null");
        Objects.requireNonNull(command.waitingId(), "waitingId must not be null");
        Objects.requireNonNull(command.boothId(), "boothId must not be null");
        Objects.requireNonNull(command.visitorId(), "visitorId must not be null");
        Objects.requireNonNull(command.previousStatus(), "previousStatus must not be null");
        Objects.requireNonNull(command.currentStatus(), "currentStatus must not be null");
    }
}
