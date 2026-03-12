package com.freeline.domain.goods.dto.request;

import jakarta.validation.constraints.NotNull;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record GoodsStatusUpdateReqDto(

        @Schema(description = "품절 여부", example = "true")
        @NotNull(message = "품절 여부는 필수입니다.")
        Boolean isSoldOut
) {
}