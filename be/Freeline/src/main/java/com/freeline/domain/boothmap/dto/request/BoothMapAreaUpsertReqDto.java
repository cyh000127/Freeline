package com.freeline.domain.boothmap.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothMapAreaUpsertReqDto(

        @Schema(description = "사각형 시작 x 비율", example = "0.1050")
        @NotNull(message = "xRatio는 필수입니다.")
        @DecimalMin(value = "0.0", message = "xRatio는 0 이상이어야 합니다.")
        @DecimalMax(value = "1.0", message = "xRatio는 1 이하여야 합니다.")
        BigDecimal xRatio,

        @Schema(description = "사각형 시작 y 비율", example = "0.2000")
        @NotNull(message = "yRatio는 필수입니다.")
        @DecimalMin(value = "0.0", message = "yRatio는 0 이상이어야 합니다.")
        @DecimalMax(value = "1.0", message = "yRatio는 1 이하여야 합니다.")
        BigDecimal yRatio,

        @Schema(description = "사각형 너비 비율", example = "0.1450")
        @NotNull(message = "widthRatio는 필수입니다.")
        @DecimalMin(value = "0.0", inclusive = false, message = "widthRatio는 0 초과여야 합니다.")
        @DecimalMax(value = "1.0", message = "widthRatio는 1 이하여야 합니다.")
        BigDecimal widthRatio,

        @Schema(description = "사각형 높이 비율", example = "0.1550")
        @NotNull(message = "heightRatio는 필수입니다.")
        @DecimalMin(value = "0.0", inclusive = false, message = "heightRatio는 0 초과여야 합니다.")
        @DecimalMax(value = "1.0", message = "heightRatio는 1 이하여야 합니다.")
        BigDecimal heightRatio
) {
}