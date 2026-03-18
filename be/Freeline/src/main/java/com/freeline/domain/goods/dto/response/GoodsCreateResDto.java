package com.freeline.domain.goods.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record GoodsCreateResDto(

        @Schema(description = "굿즈 ID", example = "101")
        Long goodsId,

        @Schema(description = "부스 ID", example = "12")
        Long boothId,

        @Schema(description = "굿즈 이름", example = "한정판 키링")
        String name,

        @Schema(description = "굿즈 이미지 URL", example = "https://cdn.freeline.com/goods/keyring.png")
        String imageUrl,

        @Schema(description = "품절 여부", example = "false")
        boolean isSoldOut
) {
}
