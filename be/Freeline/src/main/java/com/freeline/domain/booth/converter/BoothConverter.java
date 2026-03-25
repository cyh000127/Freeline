package com.freeline.domain.booth.converter;

import java.util.List;

import lombok.experimental.UtilityClass;

import com.freeline.domain.booth.dto.request.BoothCreateReqDto;
import com.freeline.domain.booth.dto.request.BoothPolicyUpdateReqDto;
import com.freeline.domain.booth.dto.response.BoothCalledUserResDto;
import com.freeline.domain.booth.dto.response.BoothCreateResDto;
import com.freeline.domain.booth.dto.response.BoothGoodsResDto;
import com.freeline.domain.booth.dto.response.BoothImageUploadResDto;
import com.freeline.domain.booth.dto.response.BoothListResDto;
import com.freeline.domain.booth.dto.response.BoothPolicyResDto;
import com.freeline.domain.booth.dto.response.BoothQueueEntryResDto;
import com.freeline.domain.booth.dto.response.BoothResDto;
import com.freeline.domain.booth.dto.response.BoothStatusResDto;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothGoods;
import com.freeline.domain.booth.entity.BoothImage;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.event.entity.EventPolicy;

@UtilityClass
public class BoothConverter {

    public Booth toEntity(final Long eventId, final BoothCreateReqDto dto) {
        return Booth.builder()
                .eventId(eventId)
                .name(dto.name())
                .locationCode(dto.locationCode())
                .openTime(dto.openTime())
                .closeTime(dto.closeTime())
                .emergencyClosed(false)
                .build();
    }

    public BoothCreateResDto toBoothCreateResDto(final Booth booth) {
        return BoothCreateResDto.builder()
                .boothId(booth.getId())
                .eventId(booth.getEventId())
                .name(booth.getName())
                .locationCode(booth.getLocationCode())
                .openTime(booth.getOpenTime())
                .closeTime(booth.getCloseTime())
                .build();
    }

    public BoothListResDto toBoothListResDto(final Booth booth) {
        return BoothListResDto.builder()
                .boothId(booth.getId())
                .name(booth.getName())
                .locationCode(booth.getLocationCode())
                .isEmergencyClosed(booth.isEmergencyClosed())
                .openTime(booth.getOpenTime())
                .closeTime(booth.getCloseTime())
                .build();
    }

    public BoothGoodsResDto toBoothGoodsResDto(final BoothGoods goods) {
        return BoothGoodsResDto.builder()
                .goodsId(goods.getId())
                .name(goods.getName())
                .imageUrl(goods.getImagePath())
                .isSoldOut(goods.isSoldOut())
                .build();
    }

    public BoothImageUploadResDto toBoothImageUploadResDto(final BoothImage boothImage) {
        return BoothImageUploadResDto.builder()
                .boothImageId(boothImage.getId())
                .boothId(boothImage.getBoothId())
                .imageUrl(boothImage.getImagePath())
                .isRepresentative(boothImage.isRepresentative())
                .build();
    }

    public BoothResDto toBoothResDto(
            final Booth booth,
            final long waitingCount,
            final int callCount,
            final int callValidSeconds,
            final String representativeImageUrl,
            final List<String> boothImageUrls,
            final List<BoothGoodsResDto> goods
    ) {
        return BoothResDto.builder()
                .boothId(booth.getId())
                .name(booth.getName())
                .locationCode(booth.getLocationCode())
                .isEmergencyClosed(booth.isEmergencyClosed())
                .waitingCount(waitingCount)
                .callCount(callCount)
                .callValidSeconds(callValidSeconds)
                .representativeImageUrl(representativeImageUrl)
                .boothImageUrls(boothImageUrls)
                .goods(goods)
                .build();
    }

    public BoothStatusResDto toBoothStatusResDto(final Booth booth) {
        return BoothStatusResDto.builder()
                .boothId(booth.getId())
                .isEmergencyClosed(booth.isEmergencyClosed())
                .build();
    }

    public BoothPolicy toBoothPolicyEntity(final Long boothId, final BoothPolicyUpdateReqDto dto) {
        return BoothPolicy.builder()
                .boothId(boothId)
                .stayTime(dto.staySeconds())
                .maxWaitingCount(dto.maxWaitingCount())
                .callCount(dto.callCount())
                .callValidTime(dto.callValidSeconds())
                .deferLimit(dto.deferLimit())
                .build();
    }

    public BoothPolicyResDto toBoothPolicyResDto(final Long boothId, final BoothPolicy boothPolicy) {
        return BoothPolicyResDto.builder()
                .boothId(boothId)
                .staySeconds(boothPolicy.getStayTime())
                .maxWaitingCount(boothPolicy.getMaxWaitingCount())
                .callCount(boothPolicy.getCallCount())
                .callValidSeconds(boothPolicy.getCallValidTime())
                .deferLimit(boothPolicy.getDeferLimit())
                .build();
    }

    public BoothPolicyResDto toBoothPolicyResDto(final Long boothId, final EventPolicy eventPolicy) {
        return BoothPolicyResDto.builder()
                .boothId(boothId)
                .staySeconds(eventPolicy.getDefaultStaySec())
                .maxWaitingCount(eventPolicy.getDefaultMaxWaiting())
                .callCount(eventPolicy.getDefaultCallCount())
                .callValidSeconds(eventPolicy.getDefaultCallTtl())
                .deferLimit(eventPolicy.getDefaultDeferLimit())
                .build();
    }

    public BoothQueueEntryResDto toBoothQueueEntryResDto(final BoothWaiting waiting) {
        return BoothQueueEntryResDto.builder()
                .waitingId(waiting.getId())
                .visitorName(waiting.getVisitor() != null ? waiting.getVisitor().getName() : null)
                .waitingNumber(waiting.getWaitingNumber())
                .status(waiting.getStatus().name())
                .calledAt(waiting.getCalledAt())
                .build();
    }

    public BoothCalledUserResDto toBoothCalledUserResDto(final BoothWaiting waiting) {
        return BoothCalledUserResDto.builder()
                .waitingId(waiting.getId())
                .visitorName(waiting.getVisitor() != null ? waiting.getVisitor().getName() : null)
                .waitingNumber(waiting.getWaitingNumber())
                .build();
    }
}
