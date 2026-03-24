package com.freeline.domain.report.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ReportStatusResponseDto {

    private final Long eventId;
    private final String status;

    public static ReportStatusResponseDto of(Long eventId, String status) {
        return new ReportStatusResponseDto(eventId, status);
    }
}
