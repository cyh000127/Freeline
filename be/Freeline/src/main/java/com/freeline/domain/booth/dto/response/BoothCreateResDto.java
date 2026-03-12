package com.freeline.domain.booth.dto.response;

import java.time.LocalTime;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothCreateResDto(

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "행사 ID", example = "5")
        Long eventId,

        @Schema(description = "부스 이름", example = "SSAFY 굿즈 부스")
        String name,

        @Schema(description = "위치 코드", example = "A-03")
        String locationCode,

        @Schema(description = "운영 시작 시간", example = "10:00")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
        LocalTime openTime,

        @Schema(description = "운영 종료 시간", example = "18:00")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
        LocalTime closeTime
) {
}
