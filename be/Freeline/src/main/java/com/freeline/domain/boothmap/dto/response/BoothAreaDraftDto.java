package com.freeline.domain.boothmap.dto.response;

import java.math.BigDecimal;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothAreaDraftDto(
        @Schema(description = "x 비율", example = "0.1050")
        BigDecimal xRatio,

        @Schema(description = "y 비율", example = "0.2000")
        BigDecimal yRatio,

        @Schema(description = "너비 비율", example = "0.1450")
        BigDecimal widthRatio,

        @Schema(description = "높이 비율", example = "0.1550")
        BigDecimal heightRatio
) {
}
