package com.freeline.domain.booth.dto.request;

import jakarta.validation.constraints.NotNull;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothStatusUpdateReqDto(

        @Schema(description = "긴급 마감 여부", example = "true")
        @NotNull(message = "긴급 마감 여부는 필수입니다.")
        Boolean isEmergencyClosed
) {
}
