package com.freeline.domain.waiting.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WaitingAdmitResDto(

        @Schema(description = "대기 ID", example = "301")
        Long waitingId,

        @Schema(description = "대기 상태", example = "ENTERED")
        String status,

        @Schema(description = "입장 시각", example = "2026-03-16T14:30:00")
        LocalDateTime enteredAt
) {
}
