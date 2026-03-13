package com.freeline.domain.waiting.dto.response;

import lombok.Builder;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WaitingCreateResDto(

        @Schema(description = "대기 ID", example = "301")
        Long waitingId,

        @Schema(description = "대기 번호", example = "14")
        Integer waitingNum,

        @Schema(description = "현재 순번", example = "14")
        Integer currentRank,

        @Schema(description = "대기 상태", example = "WAITING")
        String status,

        @Schema(description = "관람객 대기 상태", example = "FREE")
        String visitorQueueStatus
) {
}
