package com.freeline.domain.event.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record EventDetailResDto(

	@Schema(description = "행사 ID", example = "102")
	Long eventId,

	@Schema(description = "행사 주최자 ID", example = "5")
	Long eventAdminId,

	@Schema(description = "행사명", example = "2026 SSAFY 도서 축제")
	String name,

	@Schema(description = "행사 설명", example = "IT 서적과 굿즈를 만날 수 있는 특별한 전시회입니다.")
	String description,

	@Schema(description = "행사 인증 코드", example = "SSAFY_BOOK_2026", nullable = true)
	String authCode,

	@Schema(description = "행사 시작일", example = "2026-04-01")
	LocalDate startDate,

	@Schema(description = "행사 종료일", example = "2026-04-03")
	LocalDate endDate,

	@Schema(description = "운영 시작 시간", example = "09:00:00")
	LocalTime openTime,

	@Schema(description = "운영 종료 시간", example = "18:00:00")
	LocalTime closeTime,

	@Schema(description = "행사 주소", example = "서울특별시 강남구 테헤란로 212")
	String locationAddress,

	@Schema(description = "썸네일 이미지 URL", example = "https://cdn.freeline.com/thumb.jpg", nullable = true)
	String thumbnailImageUrl,

	@Schema(description = "행사 지도 이미지 URL", example = "https://cdn.freeline.com/maps/event-102-map.png", nullable = true)
	String mapImageUrl,

	@Schema(description = "행사 상태", example = "OPEN")
	String status,

	@Schema(description = "생성 일시")
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
	LocalDateTime createdAt,

	@Schema(description = "수정 일시")
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
	LocalDateTime updatedAt,

	@JsonInclude(JsonInclude.Include.NON_NULL)
	@Schema(description = "부스 요약 목록", nullable = true)
	List<BoothSummaryDto> booths
) {
	@Builder
	public record BoothSummaryDto(

		@Schema(description = "부스 ID", example = "1")
		Long boothId,

		@Schema(description = "부스명", example = "민음사 부스")
		String name,

		@Schema(description = "부스 위치 코드", example = "A-01")
		String locationCode,

		@Schema(description = "대기 상태", example = "SMOOTH")
		String waitingStatus
	) {
	}
}
