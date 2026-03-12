package com.freeline.domain.boothmap.dto.response;

import java.math.BigDecimal;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothMapAreaResDto(

        @Schema(description = "영역 ID", example = "1")
        Long areaId,

        @Schema(description = "부스 ID", example = "101")
        Long boothId,

        @Schema(description = "부스 이름", example = "A-1 민음사")
        String boothName,

        @Schema(description = "부스 위치 코드", example = "A-03")
        String locationCode,

        @Schema(description = "대기 인원 수", example = "12")
        long waitingCount,

        @Schema(description = "긴급 마감 여부", example = "false")
        boolean isEmergencyClosed,

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