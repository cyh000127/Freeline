package com.freeline.domain.event.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record EventDashboardResDto(

        @Schema(description = "행사 ID", example = "102")
        Long eventId,

        @Schema(description = "행사 상태", example = "OPEN")
        String eventStatus,

        @Schema(description = "대시보드 요약 통계")
        DashboardSummaryDto summary,

        @Schema(description = "부스 혼잡도 집계")
        BoothCongestionDto boothCongestion,

        @Schema(description = "대기열 상위 부스 목록")
        List<TopWaitingBoothDto> topWaitingBooths,

        @Schema(description = "마지막 갱신 시각", example = "2026-03-09T14:55:00")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime lastUpdated
) {
}
