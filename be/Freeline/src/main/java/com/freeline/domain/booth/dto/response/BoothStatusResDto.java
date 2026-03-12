package com.freeline.domain.booth.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothStatusResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "긴급 마감 여부", example = "true")
        boolean isEmergencyClosed
) {
}
