package com.freeline.domain.waiting.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

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
