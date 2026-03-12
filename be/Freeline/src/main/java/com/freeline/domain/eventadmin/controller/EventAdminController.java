package com.freeline.domain.eventadmin.controller;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.eventadmin.dto.request.EventAdminCreateReqDto;
import com.freeline.domain.eventadmin.dto.response.EventAdminResDto;
import com.freeline.domain.eventadmin.service.EventAdminService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "EventAdmin", description = "행사 주최자(관리자) 관리 API")
@RestController
@RequestMapping("/api/event-admins")
@RequiredArgsConstructor
public class EventAdminController {

    private final EventAdminService eventAdminService;

    @Operation(summary = "행사 주최자 회원가입", description = "시스템 총관리자가 행사 주최자 계정을 신규로 등록합니다.")
    @PostMapping
    public ResponseEntity<BaseResponse<EventAdminResDto>> createEventAdmin(
            @Valid @RequestBody final EventAdminCreateReqDto request
    ) {
        EventAdminResDto response = eventAdminService.createEventAdmin(request);
        return ResponseUtils.created(response);
    }
}
