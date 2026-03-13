package com.freeline.domain.waiting.dto.response;

import lombok.Builder;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record VisitorWaitingResDto(

        @Schema(description = "대기 ID", example = "301")
        Long waitingId,

        @Schema(description = "부스 이름", example = "SSAFY 굿즈 부스")
        String boothName,

        @Schema(description = "대기 상태", example = "WAITING")
        String status,

        @Schema(description = "내 순번", example = "5")
        Integer myRank,

        @Schema(description = "미루기 가능 여부", example = "false")
        boolean postponeAvailable
) {
}
