package com.freeline.domain.booth.dto.request;

import java.time.LocalTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothUpdateReqDto(

        @Schema(description = "부스 이름", example = "SSAFY 공식 굿즈 부스")
        @NotBlank(message = "부스 이름은 필수입니다.")
        String name,

        @Schema(description = "부스 위치 코드", example = "A-05")
        @NotBlank(message = "부스 위치 코드는 필수입니다.")
        String locationCode,

        @Schema(description = "부스 운영 시작 시간", example = "10:00")
        @NotNull(message = "부스 운영 시작 시간은 필수입니다.")
        LocalTime openTime,

        @Schema(description = "부스 운영 종료 시간", example = "19:00")
        @NotNull(message = "부스 운영 종료 시간은 필수입니다.")
        LocalTime closeTime
) {
}
