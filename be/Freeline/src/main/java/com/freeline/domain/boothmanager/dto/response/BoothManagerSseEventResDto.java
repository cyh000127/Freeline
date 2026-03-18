package com.freeline.domain.boothmanager.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BoothManagerSseEventResDto(

        @Schema(description = "이벤트 타입", example = "QUEUE_UPDATED")
        String eventType,

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "변경된 대기 ID", example = "2045", nullable = true)
        Long waitingId,

        @Schema(description = "변경된 상태", example = "REGISTERED", nullable = true)
        String changedStatus,

        @Schema(description = "이벤트 발생 시각", example = "2026-03-17T15:00:00")
        LocalDateTime occurredAt
) {
}
