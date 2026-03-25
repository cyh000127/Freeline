package com.freeline.domain.waiting.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WaitingExpectedTimeResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "신규 방문자 기준 앞에 있는 활성 팀 수", example = "7")
        Integer currentRank,

        @Schema(description = "예상 대기 시간(분)", example = "70")
        Integer estimatedMinutes,

        @Schema(description = "평균 체류 시간(분)", example = "10")
        Integer avgStayTime
) {
}
