package com.freeline.domain.auth.dto.response;

import java.util.List;

import lombok.Builder;

@Builder
public record EntryCodeBulkCreateResDto(
        Long eventId,
        int requestedCount,
        int createdCount,
        List<EntryCodeItem> entryCodes
) {
    @Builder
    public record EntryCodeItem(
            Long visitorId,
            String entryCode,
            boolean active
    ) {
    }
}
