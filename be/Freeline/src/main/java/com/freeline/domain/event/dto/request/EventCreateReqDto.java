package com.freeline.domain.event.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.web.multipart.MultipartFile;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record EventCreateReqDto(

        @Schema(description = "행사명", example = "2026 SSAFY 도서 축제")
        @NotBlank(message = "행사명은 필수입니다.")
        String name,

        @Schema(description = "행사 설명", example = "다양한 IT 서적과 세미나를 즐길 수 있는 행사입니다.")
        @NotBlank(message = "행사 설명은 필수입니다.")
        String description,

        @Schema(description = "행사 시작일", example = "2026-04-01")
        @NotNull(message = "행사 시작일은 필수입니다.")
        LocalDate startDate,

        @Schema(description = "행사 종료일", example = "2026-04-03")
        @NotNull(message = "행사 종료일은 필수입니다.")
        LocalDate endDate,

        @Schema(description = "운영 시작 시간", example = "10:00")
        @NotNull(message = "운영 시작 시간은 필수입니다.")
        LocalTime openTime,

        @Schema(description = "운영 종료 시간", example = "18:00")
        @NotNull(message = "운영 종료 시간은 필수입니다.")
        LocalTime closeTime,

        @Schema(description = "행사 주소", example = "서울특별시 강남구 테헤란로 123")
        @NotBlank(message = "행사 주소는 필수입니다.")
        String locationAddress,

        @Schema(description = "썸네일 이미지 URL", example = "https://example.com/images/event-thumbnail.png")
        String thumbnailImageUrl,

        @Schema(description = "썸네일 이미지 파일", type = "string", format = "binary", nullable = true)
        MultipartFile thumbnailImageFile
) {
}
