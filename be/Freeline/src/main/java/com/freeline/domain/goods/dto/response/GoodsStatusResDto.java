package com.freeline.domain.goods.dto.response;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record GoodsStatusResDto(

        @Schema(description = "굿즈 ID", example = "101")
        Long goodsId,

        @Schema(description = "품절 여부", example = "true")
        boolean isSoldOut
) {
}