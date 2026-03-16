package com.freeline.domain.waiting.dto.response;

import lombok.Builder;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WaitingPostponeResDto(

        @Schema(description = "대기 ID", example = "301")
        Long waitingId,

        @Schema(description = "새 순번", example = "4")
        Integer newRank,

        @Schema(description = "남은 미루기 횟수", example = "1")
        Integer remainingPostponeCount
) {
}
