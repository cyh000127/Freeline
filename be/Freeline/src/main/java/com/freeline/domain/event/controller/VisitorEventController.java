package com.freeline.domain.event.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.event.dto.response.EventDetailResDto;
import com.freeline.domain.event.service.EventService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "VisitorEvent", description = "방문자 행사 조회 API")
@RestController
@RequestMapping("/api/v1/visitors/me")
@RequiredArgsConstructor
public class VisitorEventController {

    private final EventService eventService;

    @Operation(summary = "내 행사 상세 조회", description = "방문자에게 연결된 행사 정보를 조회합니다.")
    @PreAuthorize("hasRole('VISITOR')")
    @GetMapping("/event")
    public ResponseEntity<BaseResponse<EventDetailResDto>> getMyEventDetail(
            final Authentication authentication,
            @RequestParam(required = false, defaultValue = "false") final Boolean includeBooths
    ) {
        final EventDetailResDto response = eventService.getVisitorEventDetail(extractId(authentication), includeBooths);
        return ResponseUtils.ok(response);
    }

    private Long extractId(final Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
