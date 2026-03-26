package com.freeline.domain.boothmap.controller;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
import com.freeline.domain.boothmap.dto.response.BoothMapResDto;
import com.freeline.domain.boothmap.dto.response.EventMapUploadResDto;
import com.freeline.domain.boothmap.service.BoothMapService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "BoothMap", description = "부스 지도 API")
@RestController
@RequestMapping("/api/v1/boothmaps")
@RequiredArgsConstructor
public class BoothMapController {

    private final BoothMapService boothMapService;

    @Operation(summary = "행사 지도 이미지 업로드 및 AI 분석", description = "지도 이미지를 저장하고 AI 분석으로 추출된 임시 부스 좌표들을 반환합니다.")
    @PostMapping(value = "/events/{eventId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<EventMapUploadResDto>> upsertEventMap(
            @PathVariable final Long eventId,
            @RequestPart("file") final MultipartFile file,
            @RequestParam(defaultValue = "true") final Boolean isVisible
    ) {
        final EventMapUploadResDto response = boothMapService.upsertEventMap(eventId, file, Boolean.TRUE.equals(isVisible));
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

    @Operation(summary = "부스 매핑 임시 저장", description = "작업 중인 부스 매핑 정보(스냅샷)를 임시로 저장합니다.")
    @PutMapping("/events/{eventId}/snapshot")
    public ResponseEntity<BaseResponse<Void>> saveMappingSnapshot(
            @PathVariable final Long eventId,
            @Valid @RequestBody final com.freeline.domain.boothmap.dto.request.MappingSnapshotUpdateReqDto request
    ) {
        boothMapService.updateMappingSnapshot(eventId, request);
        return ResponseUtils.ok(null);
    }

    @Operation(summary = "부스 영역 일괄 저장", description = "지도 위의 부스 영역들을 한 번에 저장하고 대표 지도로 설정합니다.")
    @PutMapping("/events/{eventId}/areas/bulk")
    public ResponseEntity<BaseResponse<Void>> bulkUpsertBoothMapAreas(
            @PathVariable final Long eventId,
            @Valid @RequestBody final com.freeline.domain.boothmap.dto.request.BoothMapAreaBulkUpsertReqDto request
    ) {
        boothMapService.bulkUpsertBoothMapAreas(eventId, request);
        return ResponseUtils.ok(null);
    }
}
