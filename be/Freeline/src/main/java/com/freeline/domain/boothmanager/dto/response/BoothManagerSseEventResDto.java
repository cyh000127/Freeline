package com.freeline.domain.boothmanager.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BoothManagerSseEventResDto(

        @Schema(description = "이벤트 ID", example = "550e8400-e29b-41d4-a716-446655440000", nullable = true)
        UUID eventId,

        @Schema(description = "대기열 이벤트 타입", example = "WAITING_REGISTERED")
        String eventType,

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "변경된 대기 ID", example = "2045", nullable = true)
        Long waitingId,

        @Schema(description = "변경된 상태", example = "REGISTERED", nullable = true)
        String changedStatus,

        @Schema(description = "이전 상태", example = "CALLED", nullable = true)
        String previousStatus,

        @Schema(description = "UI 반영 방식", example = "UPSERT", nullable = true)
        String operation,

        @Schema(description = "이전 화면 영역", example = "FRONT_QUEUE", nullable = true)
        String previousSection,

        @Schema(description = "현재 화면 영역", example = "IN_USE", nullable = true)
        String section,

        @Schema(description = "화면 반영용 대기 항목", nullable = true)
        BoothManagerWaitingItemResDto item,

        @Schema(description = "이벤트 발생 시각", example = "2026-03-17T15:00:00")
        LocalDateTime occurredAt
) {
}
