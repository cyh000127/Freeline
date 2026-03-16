package com.freeline.domain.waiting.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;

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
