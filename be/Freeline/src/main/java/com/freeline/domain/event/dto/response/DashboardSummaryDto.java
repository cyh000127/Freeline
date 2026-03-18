package com.freeline.domain.event.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record DashboardSummaryDto(

        @Schema(description = "전체 대기 팀 수", example = "156")
        Integer totalWaitingTeams,

        @Schema(description = "전체 완료 팀 수", example = "430")
        Integer totalCompletedTeams,

        @Schema(description = "평균 대기 시간(분)", example = "45")
        Integer averageWaitingTime,

        @Schema(description = "운영 중인 부스 수", example = "12")
        Integer activeBoothsCount
) {
}
