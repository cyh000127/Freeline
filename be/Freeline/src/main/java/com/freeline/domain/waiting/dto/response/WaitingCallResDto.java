package com.freeline.domain.waiting.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WaitingCallResDto(

        @Schema(description = "대기 ID", example = "301")
        Long waitingId,

        @Schema(description = "대기 번호", example = "14")
        Integer waitingNum,

        @Schema(description = "대기 상태", example = "CALLED")
        String status,

        @Schema(description = "호출 시각", example = "2026-03-16T14:30:00")
        LocalDateTime calledAt,

        @Schema(description = "호출 만료 시각", example = "2026-03-16T14:33:00")
        LocalDateTime expiresAt
) {
}
