package com.freeline.domain.waiting.dto.message;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;

@Builder
public record WaitingExpireTaskMessage(
        UUID eventId,
        Long waitingId,
        LocalDateTime expiresAt
) {
}
