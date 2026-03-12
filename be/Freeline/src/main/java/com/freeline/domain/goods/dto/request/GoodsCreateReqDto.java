package com.freeline.domain.goods.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.web.multipart.MultipartFile;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record GoodsCreateReqDto(

        @Schema(description = "굿즈 이름", example = "한정판 키링")
        @NotBlank(message = "굿즈 이름은 필수입니다.")
        @Size(max = 120, message = "굿즈 이름은 120자 이하여야 합니다.")
        String name,

        @Schema(description = "굿즈 이미지 파일", type = "string", format = "binary")
        @NotNull(message = "굿즈 이미지는 필수입니다.")
        MultipartFile imageFile
) {
}