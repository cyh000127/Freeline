package com.freeline.domain.event.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record TopWaitingBoothDto(

        @Schema(description = "부스 ID", example = "15")
        Long boothId,

        @Schema(description = "부스명", example = "인기 굿즈존")
        String name,

        @Schema(description = "대기 팀 수", example = "45")
        Integer waitingTeams,

        @Schema(description = "예상 대기 시간(분)", example = "90")
        Integer expectedWaitMin
) {
}
