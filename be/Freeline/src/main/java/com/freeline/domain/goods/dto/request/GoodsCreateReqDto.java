package com.freeline.domain.goods.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record GoodsCreateReqDto(

        @Schema(description = "굿즈 이름", example = "한정판 키링")
        @NotBlank(message = "굿즈 이름은 필수입니다.")
        @Size(max = 120, message = "굿즈 이름은 120자 이하여야 합니다.")
        String name,

        @Schema(description = "굿즈 이미지 URL", example = "https://cdn.freeline.com/goods/keyring.png")
        @NotBlank(message = "굿즈 이미지 URL은 필수입니다.")
        @Size(max = 500, message = "굿즈 이미지 URL은 500자 이하여야 합니다.")
        String imageUrl
) {
}