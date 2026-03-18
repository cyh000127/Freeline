package com.freeline.domain.qr.controller;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.qr.dto.request.QrScanReqDto;
import com.freeline.domain.qr.dto.response.BoothQrResDto;
import com.freeline.domain.qr.dto.response.QrScanResDto;
import com.freeline.domain.qr.service.QrService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "QR", description = "부스 QR 관리 API")
@RestController
@RequestMapping("/api/v1/qr")
@RequiredArgsConstructor
public class QrController {

    private final QrService qrService;

    // TODO: 인증/인가 적용 시 부스 QR 조회는 부스 관리자와 행사 참여자 모두 접근 가능하도록 정책을 분리한다.
    // TODO: 인증/인가 적용 시 QR 생성/재발급은 부스 관리자 권한으로 제한한다.

    @Operation(summary = "부스 QR 생성", description = "부스에 부착할 고정형 QR payload를 생성합니다. 활성 QR이 있으면 기존 QR을 반환합니다.")
    @PostMapping("/booths/{boothId}")
    public ResponseEntity<BaseResponse<BoothQrResDto>> createBoothQr(
            @PathVariable final Long boothId
    ) {
        final BoothQrResDto response = qrService.createBoothQr(boothId);
        return ResponseUtils.created(response);
    }

    @Operation(summary = "부스 QR 조회", description = "현재 활성 상태인 부스 QR payload를 조회합니다.")
    @GetMapping("/booths/{boothId}")
    public ResponseEntity<BaseResponse<BoothQrResDto>> getBoothQr(
            @PathVariable final Long boothId
    ) {
        final BoothQrResDto response = qrService.getBoothQr(boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "부스 QR 재발급", description = "기존 QR을 재발급 처리하고 새로운 고정형 QR payload를 생성합니다.")
    @PatchMapping("/booths/{boothId}/reissue")
    public ResponseEntity<BaseResponse<BoothQrResDto>> reissueBoothQr(
            @PathVariable final Long boothId
    ) {
        final BoothQrResDto response = qrService.reissueBoothQr(boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "QR 스캔 등록", description = "사용자가 부스 QR을 스캔하면 호출 상태를 확인하고 앞큐 등록 상태로 변경합니다.")
    @PostMapping("/scan")
    public ResponseEntity<BaseResponse<QrScanResDto>> scanQr(
            @Valid @RequestBody final QrScanReqDto request
    ) {
        final QrScanResDto response = qrService.scanQr(request);
        return ResponseUtils.ok(response);
    }
}
