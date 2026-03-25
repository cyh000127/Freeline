package com.freeline.domain.goods.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.auth.service.BoothAccessService;
import com.freeline.domain.goods.dto.request.GoodsCreateReqDto;
import com.freeline.domain.goods.dto.request.GoodsStatusUpdateReqDto;
import com.freeline.domain.goods.dto.response.GoodsCreateResDto;
import com.freeline.domain.goods.dto.response.GoodsListResDto;
import com.freeline.domain.goods.dto.response.GoodsStatusResDto;
import com.freeline.domain.goods.service.GoodsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Goods", description = "굿즈 관리 API")
@RestController
@RequestMapping("/api/v1/goods")
@RequiredArgsConstructor
public class GoodsController {

    private final GoodsService goodsService;
    private final BoothAccessService boothAccessService;

    @Operation(summary = "굿즈 생성", description = "특정 부스에 새로운 굿즈를 등록합니다.")
    @PostMapping(value = "/booths/{boothId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<GoodsCreateResDto>> createGoods(
            final Authentication authentication,
            @PathVariable final Long boothId,
            @Valid @ModelAttribute final GoodsCreateReqDto request
    ) {
        boothAccessService.validateBoothAccess(authentication, boothId);
        final GoodsCreateResDto response = goodsService.createGoods(boothId, request);
        return ResponseUtils.created(response);
    }

    @Operation(summary = "굿즈 목록 조회", description = "특정 부스에 등록된 굿즈 목록을 조회합니다.")
    @GetMapping("/booths/{boothId}")
    public ResponseEntity<BaseResponse<List<GoodsListResDto>>> getGoods(
            @PathVariable final Long boothId
    ) {
        final List<GoodsListResDto> response = goodsService.getGoods(boothId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "굿즈 상태 수정", description = "특정 굿즈의 품절 여부를 수정합니다.")
    @PatchMapping("/{goodsId}/status")
    public ResponseEntity<BaseResponse<GoodsStatusResDto>> updateGoodsStatus(
            final Authentication authentication,
            @PathVariable final Long goodsId,
            @Valid @RequestBody final GoodsStatusUpdateReqDto request
    ) {
        boothAccessService.validateGoodsAccess(authentication, goodsId);
        final GoodsStatusResDto response = goodsService.updateGoodsStatus(goodsId, request);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "굿즈 삭제", description = "특정 굿즈를 삭제합니다.")
    @DeleteMapping("/{goodsId}")
    public ResponseEntity<BaseResponse<Void>> deleteGoods(
            final Authentication authentication,
            @PathVariable final Long goodsId
    ) {
        boothAccessService.validateGoodsAccess(authentication, goodsId);
        goodsService.deleteGoods(goodsId);
        return ResponseUtils.noContent();
    }
}
