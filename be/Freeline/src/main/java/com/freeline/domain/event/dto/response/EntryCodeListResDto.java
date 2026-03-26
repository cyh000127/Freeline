package com.freeline.domain.event.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record EntryCodeListResDto(
        Long visitorId,
        String entryCode,
        boolean isActive,
        LocalDateTime createdAt
) {
}
