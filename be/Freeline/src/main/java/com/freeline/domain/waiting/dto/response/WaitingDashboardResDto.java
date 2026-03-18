package com.freeline.domain.waiting.dto.response;

import java.util.List;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WaitingDashboardResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "전체 활성 대기 수", example = "3")
        Integer totalWaitingCount,

        @Schema(description = "부스 대기열 목록")
        List<WaitingQueueItemDto> queueList
) {
}
