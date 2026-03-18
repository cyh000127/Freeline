package com.freeline.domain.goods.converter;

import lombok.experimental.UtilityClass;

import com.freeline.domain.booth.entity.BoothGoods;
import com.freeline.domain.goods.dto.response.GoodsCreateResDto;
import com.freeline.domain.goods.dto.response.GoodsListResDto;
import com.freeline.domain.goods.dto.response.GoodsStatusResDto;

@UtilityClass
public class GoodsConverter {

    public BoothGoods toEntity(final Long boothId, final String name, final String imageUrl) {
        return BoothGoods.builder()
                .boothId(boothId)
                .name(name)
                .imagePath(imageUrl)
                .soldOut(false)
                .build();
    }

    public GoodsCreateResDto toGoodsCreateResDto(final BoothGoods goods) {
        return GoodsCreateResDto.builder()
                .goodsId(goods.getId())
                .boothId(goods.getBoothId())
                .name(goods.getName())
                .imageUrl(goods.getImagePath())
                .isSoldOut(goods.isSoldOut())
                .build();
    }

    public GoodsStatusResDto toGoodsStatusResDto(final BoothGoods goods) {
        return GoodsStatusResDto.builder()
                .goodsId(goods.getId())
                .isSoldOut(goods.isSoldOut())
                .build();
    }

    public GoodsListResDto toGoodsListResDto(final BoothGoods goods) {
        return GoodsListResDto.builder()
                .goodsId(goods.getId())
                .name(goods.getName())
                .imageUrl(goods.getImagePath())
                .isSoldOut(goods.isSoldOut())
                .build();
    }
}
