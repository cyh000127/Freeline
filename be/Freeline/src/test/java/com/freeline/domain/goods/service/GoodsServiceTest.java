package com.freeline.domain.goods.service;

import java.util.List;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.freeline.common.file.dto.FileInfo;
import com.freeline.common.file.service.FileService;
import com.freeline.common.file.util.CloudflareStorageUtil;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothGoods;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.goods.dto.request.GoodsCreateReqDto;
import com.freeline.domain.goods.dto.request.GoodsStatusUpdateReqDto;
import com.freeline.domain.goods.dto.response.GoodsCreateResDto;
import com.freeline.domain.goods.dto.response.GoodsListResDto;
import com.freeline.domain.goods.dto.response.GoodsStatusResDto;
import com.freeline.domain.goods.exception.GoodsException;
import com.freeline.domain.goods.repository.GoodsRepository;

@ExtendWith(MockitoExtension.class)
class GoodsServiceTest {

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private GoodsRepository goodsRepository;

    @Mock
    private FileService fileService;

    @Mock
    private CloudflareStorageUtil cloudflareStorageUtil;

    @InjectMocks
    private GoodsService goodsService;

    @Test
    void 굿즈_생성_성공() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .emergencyClosed(false)
                .build();

        final BoothGoods savedGoods = BoothGoods.builder()
                .id(101L)
                .boothId(12L)
                .name("한정판 키링")
                .imagePath("https://pub-2cb3d8449bed4f6bba7e7173f1ce3c8c.r2.dev/goods/test-image.png")
                .soldOut(false)
                .build();

        final MockMultipartFile imageFile = new MockMultipartFile(
                "imageFile",
                "keyring.png",
                "image/png",
                "goods-image".getBytes()
        );

        final FileInfo fileInfo = FileInfo.builder()
                .originalFilename("keyring.png")
                .fileUrl("https://pub-2cb3d8449bed4f6bba7e7173f1ce3c8c.r2.dev/goods/test-image.png")
                .objectKey("goods/test-image.png")
                .fileSize(11L)
                .contentType("image/png")
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(fileService.uploadFile(imageFile, "goods")).thenReturn(fileInfo);
        Mockito.when(goodsRepository.save(ArgumentMatchers.any(BoothGoods.class))).thenReturn(savedGoods);

        final GoodsCreateResDto result = goodsService.createGoods(
                12L,
                GoodsCreateReqDto.builder()
                        .name("한정판 키링")
                        .imageFile(imageFile)
                        .build()
        );

        Assertions.assertThat(result.goodsId()).isEqualTo(101L);
        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.imageUrl()).isEqualTo("https://pub-2cb3d8449bed4f6bba7e7173f1ce3c8c.r2.dev/goods/test-image.png");
        Mockito.verify(goodsRepository).save(ArgumentMatchers.any(BoothGoods.class));
    }

    @Test
    void 굿즈_목록_조회_성공() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .emergencyClosed(false)
                .build();

        final BoothGoods goods = BoothGoods.builder()
                .id(101L)
                .boothId(12L)
                .name("한정판 키링")
                .imagePath("https://pub-2cb3d8449bed4f6bba7e7173f1ce3c8c.r2.dev/goods/test-image.png")
                .soldOut(false)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(goodsRepository.findAllByBoothIdOrderByIdAsc(12L)).thenReturn(List.of(goods));

        final List<GoodsListResDto> result = goodsService.getGoods(12L);

        Assertions.assertThat(result).hasSize(1);
        Assertions.assertThat(result.get(0).goodsId()).isEqualTo(101L);
        Assertions.assertThat(result.get(0).imageUrl()).isEqualTo("https://pub-2cb3d8449bed4f6bba7e7173f1ce3c8c.r2.dev/goods/test-image.png");
    }

    @Test
    void 굿즈_상태_수정_성공() {
        final BoothGoods goods = BoothGoods.builder()
                .id(101L)
                .boothId(12L)
                .name("한정판 키링")
                .imagePath("https://pub-2cb3d8449bed4f6bba7e7173f1ce3c8c.r2.dev/goods/test-image.png")
                .soldOut(false)
                .build();

        Mockito.when(goodsRepository.findById(101L)).thenReturn(Optional.of(goods));

        final GoodsStatusResDto result = goodsService.updateGoodsStatus(
                101L,
                GoodsStatusUpdateReqDto.builder()
                        .isSoldOut(true)
                        .build()
        );

        Assertions.assertThat(result.goodsId()).isEqualTo(101L);
        Assertions.assertThat(result.isSoldOut()).isTrue();
    }

    @Test
    void 굿즈_삭제_성공() {
        final BoothGoods goods = BoothGoods.builder()
                .id(101L)
                .boothId(12L)
                .name("한정판 키링")
                .imagePath("https://pub-2cb3d8449bed4f6bba7e7173f1ce3c8c.r2.dev/goods/test-image.png")
                .soldOut(false)
                .build();

        Mockito.when(goodsRepository.findById(101L)).thenReturn(Optional.of(goods));

        goodsService.deleteGoods(101L);

        Mockito.verify(cloudflareStorageUtil).deleteFile("https://pub-2cb3d8449bed4f6bba7e7173f1ce3c8c.r2.dev/goods/test-image.png");
        Mockito.verify(goodsRepository).delete(goods);
    }

    @Test
    void 굿즈_생성_실패_부스_없음() {
        final MockMultipartFile imageFile = new MockMultipartFile(
                "imageFile",
                "keyring.png",
                "image/png",
                "goods-image".getBytes()
        );

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> goodsService.createGoods(
                        12L,
                        GoodsCreateReqDto.builder()
                                .name("한정판 키링")
                                .imageFile(imageFile)
                                .build()
                )).isInstanceOf(BoothException.class)
                .hasMessage("존재하지 않는 부스입니다.");
    }

    @Test
    void 굿즈_상태_수정_실패_굿즈_없음() {
        Mockito.when(goodsRepository.findById(101L)).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> goodsService.updateGoodsStatus(
                        101L,
                        GoodsStatusUpdateReqDto.builder()
                                .isSoldOut(true)
                                .build()
                )).isInstanceOf(GoodsException.class)
                .hasMessage("존재하지 않는 굿즈입니다.");
    }
}
