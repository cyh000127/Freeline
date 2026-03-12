package com.freeline.domain.booth.dto.response;

import java.util.List;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "부스 이름", example = "SSAFY 굿즈 부스")
        String name,

        @Schema(description = "위치 코드", example = "A-03")
        String locationCode,

        @Schema(description = "긴급 마감 여부", example = "false")
        boolean isEmergencyClosed,

        @Schema(description = "현재 대기 인원", example = "35")
        long waitingCount,

        @Schema(description = "호출 인원 수", example = "5")
        int callCount,

        @Schema(description = "호출 유효 시간(초)", example = "180")
        int callValidSeconds,

        @Schema(description = "굿즈 목록")
        List<BoothGoodsResDto> goods
) {
}
