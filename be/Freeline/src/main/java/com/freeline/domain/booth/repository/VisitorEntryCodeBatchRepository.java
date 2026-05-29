package com.freeline.domain.booth.repository;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class VisitorEntryCodeBatchRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<CreatedEntryCode> insertEntryCodes(
            final Long eventId,
            final long firstSequence,
            final int quantity,
            final String entryCodePrefix,
            final int entryCodeSequenceLength
    ) {
        if (quantity <= 0) {
            return List.of();
        }

        final long lastSequence = firstSequence + quantity - 1;
        return jdbcTemplate.query("""
                INSERT INTO visitors (event_id, entry_code, name, is_active, created_at, updated_at)
                SELECT
                    ?,
                    ? || ? || '-' || LPAD(series.sequence_number::text, ?, '0'),
                    NULL,
                    true,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                FROM generate_series(?, ?) AS series(sequence_number)
                RETURNING id, entry_code, is_active
                """,
                (resultSet, rowNumber) -> new CreatedEntryCode(
                        resultSet.getLong("id"),
                        resultSet.getString("entry_code"),
                        resultSet.getBoolean("is_active")
                ),
                eventId,
                entryCodePrefix,
                eventId,
                entryCodeSequenceLength,
                firstSequence,
                lastSequence
        );
    }

    public record CreatedEntryCode(
            Long visitorId,
            String entryCode,
            boolean active
    ) {
    }
}
