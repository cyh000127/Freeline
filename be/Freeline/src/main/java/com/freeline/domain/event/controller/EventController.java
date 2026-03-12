package com.freeline.domain.event.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.response.PageResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.event.dto.request.EventCreateReqDto;
import com.freeline.domain.event.dto.request.EventUpdateReqDto;
import com.freeline.domain.event.dto.response.EventDeleteResDto;
import com.freeline.domain.event.dto.response.EventDetailResDto;
import com.freeline.domain.event.dto.response.EventListResDto;
import com.freeline.domain.event.dto.response.EventResDto;
import com.freeline.domain.event.dto.response.EventUpdateResDto;
import com.freeline.domain.event.service.EventService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

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

    @Operation(summary = "행사 상세 조회", description = "주최자가 본인이 관리하는 행사 상세 정보를 조회합니다.")
    @GetMapping("/{eventId}")
    public ResponseEntity<BaseResponse<EventDetailResDto>> getEventDetail(
            @RequestHeader("X-Event-Admin-Id") final Long eventAdminId,
            @PathVariable final Long eventId,
            @RequestParam(required = false, defaultValue = "false") final Boolean includeBooths
    ) {
        final EventDetailResDto response = eventService.getEventDetail(eventAdminId, eventId, includeBooths);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "행사 수정", description = "행사 정보와 상태를 부분 수정합니다.")
    @PatchMapping("/{eventId}")
    public ResponseEntity<BaseResponse<EventUpdateResDto>> updateEvent(
            @RequestHeader("X-Event-Admin-Id") final Long eventAdminId,
            @PathVariable final Long eventId,
            @RequestParam(required = false, defaultValue = "false") final Boolean validateOnly,
            @RequestBody final EventUpdateReqDto request
    ) {
        final EventUpdateResDto response = eventService.updateEvent(eventAdminId, eventId, validateOnly, request);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "행사 삭제", description = "행사를 삭제합니다.")
    @DeleteMapping("/{eventId}")
    public ResponseEntity<BaseResponse<EventDeleteResDto>> deleteEvent(
            @RequestHeader("X-Event-Admin-Id") final Long eventAdminId,
            @PathVariable final Long eventId,
            @RequestParam(required = false, defaultValue = "false") final Boolean cascade
    ) {
        final EventDeleteResDto response = eventService.deleteEvent(eventAdminId, eventId, cascade);
        return ResponseUtils.ok(response);
    }
}
