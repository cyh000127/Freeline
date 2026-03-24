package com.freeline.domain.booth.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.booth.dto.request.BoothCreateReqDto;
import com.freeline.domain.booth.dto.request.BoothPolicyUpdateReqDto;
import com.freeline.domain.booth.dto.request.BoothStatusUpdateReqDto;
import com.freeline.domain.booth.dto.request.BoothUpdateReqDto;
import com.freeline.domain.booth.dto.response.BoothCreateResDto;
import com.freeline.domain.booth.dto.response.BoothCsvUploadResDto;
import com.freeline.domain.booth.dto.response.BoothImageUploadResDto;
import com.freeline.domain.booth.dto.response.BoothListResDto;
import com.freeline.domain.booth.dto.response.BoothPolicyResDto;
import com.freeline.domain.booth.dto.response.BoothQueueResDto;
import com.freeline.domain.booth.dto.response.BoothResDto;
import com.freeline.domain.booth.dto.response.BoothStatusResDto;
import com.freeline.domain.booth.service.BoothService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Booth", description = "부스 관리 API")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BoothController {

    private final BoothService boothService;

    // TODO: 부스 정책 설정 API (`PATCH /api/v1/booths/{boothId}/policy`)를 추가한다.

    @Operation(summary = "부스 이미지 업로드", description = "부스 이미지를 업로드하고 boothId와 매핑하여 저장합니다.")
    @PostMapping(value = "/booths/{boothId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<BoothImageUploadResDto>> uploadBoothImage(
            @PathVariable final Long boothId,
            @RequestPart("file") final MultipartFile file
    ) {
        final BoothImageUploadResDto response = boothService.uploadBoothImage(boothId, file, false);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 대표 이미지 업로드", description = "부스 대표 이미지를 업로드하고 boothId와 매핑하여 저장합니다.")
    @PostMapping(value = "/booths/{boothId}/image/representative", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<BoothImageUploadResDto>> uploadRepresentativeBoothImage(
            @PathVariable final Long boothId,
            @RequestPart("file") final MultipartFile file,
            @RequestParam(defaultValue = "true") final Boolean representative
    ) {
        final BoothImageUploadResDto response = boothService.uploadBoothImage(boothId, file, Boolean.TRUE.equals(representative));
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 CSV 일괄 등록", description = "행사에 속한 부스 목록을 CSV 파일로 업로드하여 일괄 등록합니다.")
    @PostMapping(value = "/events/{eventId}/booths/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<BoothCsvUploadResDto>> uploadBoothsByCsv(
            @PathVariable("eventId") final Long eventId,
            @RequestPart("file") final MultipartFile file
    ) {
        final BoothCsvUploadResDto response = boothService.uploadBoothsByCsv(eventId, file);
        return ResponseUtils.created(response);
    }

    @Operation(summary = "부스 등록", description = "특정 행사에 새로운 부스를 등록합니다.")
    @PostMapping("/booths/events/{eventId}")
    public ResponseEntity<BaseResponse<BoothCreateResDto>> createBooth(
            @PathVariable final Long eventId,
            @Valid @RequestBody final BoothCreateReqDto request
    ) {
        final BoothCreateResDto response = boothService.createBooth(eventId, request);
        return ResponseUtils.created(response);
    }

    @Operation(summary = "전체 부스 조회", description = "특정 행사에 속한 모든 부스를 조회합니다.")
    @GetMapping("/booths/events/{eventId}")
    public ResponseEntity<BaseResponse<List<BoothListResDto>>> getBooths(
            @PathVariable final Long eventId
    ) {
        final List<BoothListResDto> response = boothService.getBooths(eventId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 상세 조회", description = "특정 부스의 상세 정보와 굿즈 정보를 조회합니다.")
    @GetMapping("/booths/{boothId}")
    public ResponseEntity<BaseResponse<BoothResDto>> getBooth(
            @PathVariable final Long boothId
    ) {
        final BoothResDto response = boothService.getBooth(boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 대기열 현황 조회", description = "특정 부스의 현재 대기열 상태를 조회합니다.")
    @GetMapping("/booths/{boothId}/queue")
    public ResponseEntity<BaseResponse<BoothQueueResDto>> getBoothQueue(
            @PathVariable final Long boothId
    ) {
        final BoothQueueResDto response = boothService.getBoothQueue(boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 정책 조회", description = "특정 부스에 현재 적용 중인 대기열 운영 정책을 조회합니다.")
    @GetMapping("/{boothId}/policy")
    public ResponseEntity<BaseResponse<BoothPolicyResDto>> getBoothPolicy(
            @PathVariable final Long boothId
    ) {
        final BoothPolicyResDto response = boothService.getBoothPolicy(boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 정책 설정", description = "특정 부스의 대기열 운영 정책을 설정하거나 수정합니다.")
    @PatchMapping("/booths/{boothId}/policy")
    public ResponseEntity<BaseResponse<BoothPolicyResDto>> upsertBoothPolicy(
            @PathVariable final Long boothId,
            @Valid @RequestBody final BoothPolicyUpdateReqDto request
    ) {
        final BoothPolicyResDto response = boothService.upsertBoothPolicy(boothId, request);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 운영 상태 변경", description = "특정 부스의 긴급 마감 여부를 변경합니다.")
    @PatchMapping("/booths/{boothId}/status")
    public ResponseEntity<BaseResponse<BoothStatusResDto>> updateBoothStatus(
            @PathVariable final Long boothId,
            @Valid @RequestBody final BoothStatusUpdateReqDto request
    ) {
        final BoothStatusResDto response = boothService.updateBoothStatus(boothId, request);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 정보 수정", description = "특정 부스의 이름, 위치, 운영 시간을 수정합니다.")
    @PatchMapping("/booths/{boothId}")
    public ResponseEntity<BaseResponse<BoothCreateResDto>> updateBooth(
            @PathVariable final Long boothId,
            @Valid @RequestBody final BoothUpdateReqDto request
    ) {
        final BoothCreateResDto response = boothService.updateBooth(boothId, request);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 삭제", description = "특정 부스를 삭제합니다.")
    @DeleteMapping("/booths/{boothId}")
    public ResponseEntity<BaseResponse<Void>> deleteBooth(
            @PathVariable final Long boothId
    ) {
        boothService.deleteBooth(boothId);
        return ResponseUtils.ok(null);
    }
}
