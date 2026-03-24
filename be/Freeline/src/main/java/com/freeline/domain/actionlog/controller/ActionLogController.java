package com.freeline.domain.actionlog.controller;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.actionlog.dto.request.ActionLogBulkReqDto;
import com.freeline.domain.actionlog.dto.response.ActionLogBulkResDto;
import com.freeline.domain.actionlog.service.ActionLogService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "ActionLog", description = "행동 로그 수집 API")
@RestController
@RequestMapping("/api/v1/logs")
@RequiredArgsConstructor
public class ActionLogController {

	private final ActionLogService actionLogService;

	@Operation(summary = "행동 로그 벌크 수집", description = "모바일 앱에서 수집한 행동 로그를 벌크로 전송합니다.")
	@PostMapping("/actions")
	public ResponseEntity<BaseResponse<ActionLogBulkResDto>> collectLogs(
			final Authentication authentication,
			@Valid @RequestBody final ActionLogBulkReqDto request
	) {
		final Long visitorId = extractId(authentication);
		final ActionLogBulkResDto response = actionLogService.collectLogs(visitorId, request);
		return ResponseUtils.ok(response);
	}

	private Long extractId(final Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
