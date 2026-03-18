package com.freeline.domain.boothmanager.dto.response;

import java.util.List;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BoothManagerDashboardResDto(

        @Schema(description = "부스 기본 정보")
        BoothManagerBoothResDto booth,

        @Schema(description = "요약 정보")
        BoothManagerSummaryResDto summary,

        @Schema(description = "앞큐 목록")
        List<BoothManagerWaitingItemResDto> frontQueue,

        @Schema(description = "현재 이용중 목록")
        List<BoothManagerWaitingItemResDto> inUse
) {
}
