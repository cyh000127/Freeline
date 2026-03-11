package com.freeline.domain.event.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
public record EventListResDto(

	@Schema(description = "행사 ID", example = "1")
	Long eventId,

	@Schema(description = "행사명", example = "2026 SSAFY 도서 축제")
	String name,

	@Schema(description = "행사 시작일", example = "2026-04-01")
	LocalDate startDate,

	@Schema(description = "행사 종료일", example = "2026-04-03")
	LocalDate endDate,

	@Schema(description = "행사 상태", example = "DRAFT")
	String status,

	@Schema(description = "썸네일 이미지 URL", example = "https://example.com/images/event-thumbnail.png")
	String thumbnailImageUrl,

	@Schema(description = "생성 일시")
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
	LocalDateTime createdAt
) {
}
