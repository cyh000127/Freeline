package com.freeline.domain.boothmanager.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BoothManagerSummaryResDto(

        @Schema(description = "전체 활성 대기 수", example = "25")
        int totalActiveCount,

        @Schema(description = "뒷큐 대기 수", example = "18")
        int waitingCount,

        @Schema(description = "앞큐 대기 수", example = "5")
        int frontQueueCount,

        @Schema(description = "현재 부스 이용중 수", example = "2")
        int inUseCount,

        @Schema(description = "다른 부스 이용중이라 현재 호출 불가한 수", example = "3")
        int blockedByOtherBoothCount
) {
}
