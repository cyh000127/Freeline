package com.freeline.domain.waiting.dto.response;

import lombok.Builder;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WaitingExpectedTimeResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "현재 대기 팀 수", example = "7")
        Integer currentRank,

        @Schema(description = "예상 대기 시간(분)", example = "70")
        Integer estimatedMinutes,

        @Schema(description = "평균 체류 시간(분)", example = "10")
        Integer avgStayTime
) {
}
