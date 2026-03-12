package com.freeline.domain.event.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record EventUpdateReqDto(

        @Schema(description = "행사명", example = "2026 SSAFY Book Fair", nullable = true)
        String name,

        @Schema(description = "행사 상태", example = "OPEN", nullable = true)
        String status,

        @Schema(description = "행사 시작일", example = "2026-04-01", nullable = true)
        LocalDate startDate,

        @Schema(description = "행사 종료일", example = "2026-04-03", nullable = true)
        LocalDate endDate,

        @Schema(description = "운영 시작 시간", example = "10:00", nullable = true)
        LocalTime openTime,

        @Schema(description = "운영 종료 시간", example = "18:00", nullable = true)
        LocalTime closeTime,

        @Schema(description = "행사 주소", example = "Seoul Gangnam-gu Teheran-ro 123", nullable = true)
        String locationAddress,

        @Schema(description = "썸네일 이미지 URL", example = "https://example.com/images/event-thumbnail.png", nullable = true)
        String thumbnailImageUrl
) {
}
