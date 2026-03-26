package com.freeline.domain.boothmap.dto.request;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothMapAreaBulkUpsertReqDto(
        @Schema(description = "행사 지도 ID", example = "10")
        @NotNull(message = "행사 지도 ID는 필수입니다.")
        Long eventMapId,

        @Valid
        @NotEmpty(message = "부스 영역 리스트는 비어 있을 수 없습니다.")
        List<AreaItem> areas
) {
    @Builder
    public record AreaItem(
            @Schema(description = "부스 ID", example = "101")
            @NotNull(message = "부스 ID는 필수입니다.")
            Long boothId,

            @Schema(description = "x 비율", example = "0.1050")
            @NotNull(message = "xRatio는 필수입니다.")
            @DecimalMin(value = "0.0", message = "xRatio는 0.0 이상이어야 합니다.")
            @DecimalMax(value = "1.0", message = "xRatio는 1.0 이하여야 합니다.")
            BigDecimal xRatio,

            @Schema(description = "y 비율", example = "0.2000")
            @NotNull(message = "yRatio는 필수입니다.")
            @DecimalMin(value = "0.0", message = "yRatio는 0.0 이상이어야 합니다.")
            @DecimalMax(value = "1.0", message = "yRatio는 1.0 이하여야 합니다.")
            BigDecimal yRatio,

            @Schema(description = "너비 비율", example = "0.1450")
            @NotNull(message = "widthRatio는 필수입니다.")
            @DecimalMin(value = "0.0", message = "widthRatio는 0.0 이상이어야 합니다.")
            @DecimalMax(value = "1.0", message = "widthRatio는 1.0 이하여야 합니다.")
            BigDecimal widthRatio,

            @Schema(description = "높이 비율", example = "0.1550")
            @NotNull(message = "heightRatio는 필수입니다.")
            @DecimalMin(value = "0.0", message = "heightRatio는 0.0 이상이어야 합니다.")
            @DecimalMax(value = "1.0", message = "heightRatio는 1.0 이하여야 합니다.")
            BigDecimal heightRatio
    ) {
    }
}
