package com.freeline.domain.booth.dto.response;

import java.time.LocalTime;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothListResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "부스 이름", example = "SSAFY 굿즈 부스")
        String name,

        @Schema(description = "위치 코드", example = "A-03")
        String locationCode,

        @Schema(description = "부스 관리자 ID", example = "3")
        Long boothAdminId,

        @Schema(description = "긴급 마감 여부", example = "false")
        boolean isEmergencyClosed,

        @Schema(description = "운영 시작 시간", example = "10:00")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
        LocalTime openTime,

        @Schema(description = "운영 종료 시간", example = "18:00")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
        LocalTime closeTime
) {
}
