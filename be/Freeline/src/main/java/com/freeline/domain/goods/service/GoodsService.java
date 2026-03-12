package com.freeline.domain.goods.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.file.dto.FileInfo;
import com.freeline.common.file.service.FileService;
import com.freeline.common.file.util.CloudflareStorageUtil;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothGoods;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.goods.converter.GoodsConverter;
import com.freeline.domain.goods.dto.request.GoodsCreateReqDto;
import com.freeline.domain.goods.dto.request.GoodsStatusUpdateReqDto;
import com.freeline.domain.goods.dto.response.GoodsCreateResDto;
import com.freeline.domain.goods.dto.response.GoodsListResDto;
import com.freeline.domain.goods.dto.response.GoodsStatusResDto;
import com.freeline.domain.goods.exception.GoodsException;
import com.freeline.domain.goods.repository.GoodsRepository;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class GoodsService {

    private static final String GOODS_DIRECTORY = "goods";

    private final BoothRepository boothRepository;
    private final GoodsRepository goodsRepository;
    private final FileService fileService;
    private final CloudflareStorageUtil cloudflareStorageUtil;

    public GoodsCreateResDto createGoods(final Long boothId, final GoodsCreateReqDto request) {
        getBoothEntity(boothId);

        final FileInfo uploadedFile = fileService.uploadFile(request.imageFile(), GOODS_DIRECTORY);
        final BoothGoods goods = GoodsConverter.toEntity(boothId, request.name(), uploadedFile.fileUrl());
        final BoothGoods saved = goodsRepository.save(goods);

        log.info("[Goods] 생성 완료 {id: {}, boothId: {}}", saved.getId(), saved.getBoothId());

        return GoodsConverter.toGoodsCreateResDto(saved);
    }

    @Transactional(readOnly = true)
    public List<GoodsListResDto> getGoods(final Long boothId) {
        getBoothEntity(boothId);

        return goodsRepository.findAllByBoothIdOrderByIdAsc(boothId)
                .stream()
                .map(GoodsConverter::toGoodsListResDto)
                .toList();
    }

    public GoodsStatusResDto updateGoodsStatus(final Long goodsId, final GoodsStatusUpdateReqDto request) {
        final BoothGoods goods = getGoodsEntity(goodsId);
        goods.updateSoldOut(request.isSoldOut());

        log.info("[Goods] 상태 변경 완료 {id: {}, soldOut: {}}", goods.getId(), goods.isSoldOut());

        return GoodsConverter.toGoodsStatusResDto(goods);
    }

    public void deleteGoods(final Long goodsId) {
        final BoothGoods goods = getGoodsEntity(goodsId);
        cloudflareStorageUtil.deleteFile(goods.getImagePath());
        goodsRepository.delete(goods);

        log.info("[Goods] 삭제 완료 {id: {}, boothId: {}}", goods.getId(), goods.getBoothId());
    }

    private Booth getBoothEntity(final Long boothId) {
        return boothRepository.findById(boothId)
                .orElseThrow(() -> new BoothException(ErrorCode.BOOTH_NOT_FOUND));
    }

    private BoothGoods getGoodsEntity(final Long goodsId) {
        return goodsRepository.findById(goodsId)
                .orElseThrow(() -> new GoodsException(ErrorCode.GOODS_NOT_FOUND));
    }
}