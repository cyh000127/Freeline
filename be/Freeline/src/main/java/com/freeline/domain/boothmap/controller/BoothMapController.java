package com.freeline.domain.boothmap.controller;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.boothmap.dto.request.BoothMapAreaUpsertReqDto;
import com.freeline.domain.boothmap.dto.response.BoothMapAreaUpsertResDto;
import com.freeline.domain.boothmap.dto.response.BoothMapResDto;
import com.freeline.domain.boothmap.dto.response.EventMapUpsertResDto;
import com.freeline.domain.boothmap.service.BoothMapService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "BoothMap", description = "부스 지도 API")
@RestController
@RequestMapping("/api/v1/boothmaps")
@RequiredArgsConstructor
public class BoothMapController {

    private final BoothMapService boothMapService;

    @Operation(summary = "행사 지도 이미지 업로드 및 저장", description = "행사 지도 이미지를 업로드하고 event_maps 테이블에 저장하거나 수정합니다.")
    @PostMapping(value = "/events/{eventId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<EventMapUpsertResDto>> upsertEventMap(
            @PathVariable final Long eventId,
            @RequestPart("file") final MultipartFile file,
            @RequestParam(defaultValue = "true") final Boolean isVisible
    ) {
        final EventMapUpsertResDto response = boothMapService.upsertEventMap(eventId, file, Boolean.TRUE.equals(isVisible));
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 지도 조회", description = "행사 지도 이미지와 부스 사각형 영역 정보를 조회합니다.")
    @GetMapping("/events/{eventId}")
    public ResponseEntity<BaseResponse<BoothMapResDto>> getBoothMap(
            @PathVariable final Long eventId
    ) {
        final BoothMapResDto response = boothMapService.getBoothMap(eventId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 지도 영역 저장", description = "부스의 사각형 영역 좌표를 최초 저장합니다.")
    @PutMapping("/event-maps/{eventMapId}/booths/{boothId}/area")
    public ResponseEntity<BaseResponse<BoothMapAreaUpsertResDto>> upsertBoothMapArea(
            @PathVariable final Long eventMapId,
            @PathVariable final Long boothId,
            @Valid @RequestBody final BoothMapAreaUpsertReqDto request
    ) {
        final BoothMapAreaUpsertResDto response = boothMapService.upsertBoothMapArea(eventMapId, boothId, request);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 영역 수정", description = "기존 부스 지도 영역의 좌표와 크기를 수정합니다.")
    @PatchMapping("/event-maps/{eventMapId}/booths/{boothId}/area")
    public ResponseEntity<BaseResponse<BoothMapAreaUpsertResDto>> updateBoothMapArea(
            @PathVariable final Long eventMapId,
            @PathVariable final Long boothId,
            @Valid @RequestBody final BoothMapAreaUpsertReqDto request
    ) {
        final BoothMapAreaUpsertResDto response = boothMapService.upsertBoothMapArea(eventMapId, boothId, request);
        return ResponseUtils.ok(response);
    }
}
