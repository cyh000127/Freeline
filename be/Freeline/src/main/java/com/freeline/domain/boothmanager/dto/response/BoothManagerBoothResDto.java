package com.freeline.domain.boothmanager.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BoothManagerBoothResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "부스 이름", example = "A-01 부스")
        String boothName,

        @Schema(description = "부스 위치 코드", example = "A-01")
        String locationCode,

        @Schema(description = "긴급 운영 중지 여부", example = "false")
        boolean emergencyClosed
) {
}
