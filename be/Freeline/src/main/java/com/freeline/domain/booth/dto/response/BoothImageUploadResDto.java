package com.freeline.domain.booth.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record BoothImageUploadResDto(

        @Schema(description = "부스 이미지 ID", example = "7")
        Long boothImageId,

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "부스 이미지 URL", example = "https://pub-example.r2.dev/booth/uuid.png")
        String imageUrl,

        @Schema(description = "대표 이미지 여부", example = "false")
        boolean isRepresentative
) {
}
