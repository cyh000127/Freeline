package com.freeline.domain.booth.converter;

import java.util.List;

import lombok.experimental.UtilityClass;

import com.freeline.domain.booth.dto.request.BoothCreateReqDto;
import com.freeline.domain.booth.dto.response.BoothCalledUserResDto;
import com.freeline.domain.booth.dto.response.BoothCreateResDto;
import com.freeline.domain.booth.dto.response.BoothGoodsResDto;
import com.freeline.domain.booth.dto.response.BoothImageUploadResDto;
import com.freeline.domain.booth.dto.response.BoothListResDto;
import com.freeline.domain.booth.dto.response.BoothQueueEntryResDto;
import com.freeline.domain.booth.dto.response.BoothQueueResDto;
import com.freeline.domain.booth.dto.response.BoothResDto;
import com.freeline.domain.booth.dto.response.BoothStatusResDto;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothGoods;
import com.freeline.domain.booth.entity.BoothImage;
import com.freeline.domain.booth.entity.BoothWaiting;

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
                .goods(goods)
                .build();
    }

    public BoothStatusResDto toBoothStatusResDto(final Booth booth) {
        return BoothStatusResDto.builder()
                .boothId(booth.getId())
                .isEmergencyClosed(booth.isEmergencyClosed())
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

    public BoothQueueResDto toBoothQueueResDto(
            final Long boothId,
            final long backQueueCount,
            final long frontQueueCount,
            final List<BoothQueueEntryResDto> frontQueue,
            final BoothCalledUserResDto currentCalledUser
    ) {
        return BoothQueueResDto.builder()
                .boothId(boothId)
                .backQueueCount(backQueueCount)
                .frontQueueCount(frontQueueCount)
                .frontQueue(frontQueue)
                .currentCalledUser(currentCalledUser)
                .build();
    }
}
