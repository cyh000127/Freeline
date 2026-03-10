package com.freeline.domain.event.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.response.PageResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.event.dto.request.EventCreateReqDto;
import com.freeline.domain.event.dto.response.EventListResDto;
import com.freeline.domain.event.dto.response.EventResDto;
import com.freeline.domain.event.service.EventService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Event", description = "행사 관리 API")
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

	private final EventService eventService;

	@Operation(summary = "행사 생성", description = "주최자가 신규 행사를 생성합니다.")
	@PostMapping
	public ResponseEntity<BaseResponse<EventResDto>> createEvent(
		@RequestHeader("X-Event-Admin-Id") final Long eventAdminId,
		@Valid @RequestBody final EventCreateReqDto request
	) {
		final EventResDto response = eventService.createEvent(eventAdminId, request);
		return ResponseUtils.created(response);
	}

	@Operation(summary = "전체 행사 목록 조회", description = "최신 생성일 기준으로 전체 행사 목록을 조회합니다.")
	@GetMapping
	public ResponseEntity<PageResponse<EventListResDto>> getEvents(
		@RequestHeader("X-Event-Admin-Id") final Long eventAdminId,
		@RequestParam(defaultValue = "ALL") final String status,
		@RequestParam(defaultValue = "0") final int page,
		@RequestParam(defaultValue = "10") final int size
	) {
		final Page<EventListResDto> response = eventService.getEvents(eventAdminId, status, page, size);
		return ResponseUtils.page(response);
	}
}
