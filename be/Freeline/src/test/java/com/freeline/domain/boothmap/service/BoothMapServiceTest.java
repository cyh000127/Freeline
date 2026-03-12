package com.freeline.domain.boothmap.service;

import java.math.BigDecimal;
import java.time.LocalTime;
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

import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.boothmap.dto.request.BoothMapAreaUpsertReqDto;
import com.freeline.domain.boothmap.dto.response.BoothMapAreaUpsertResDto;
import com.freeline.domain.boothmap.dto.response.BoothMapResDto;
import com.freeline.domain.boothmap.entity.BoothMapArea;
import com.freeline.domain.boothmap.entity.EventMap;
import com.freeline.domain.boothmap.repository.BoothMapAreaRepository;
import com.freeline.domain.boothmap.repository.EventMapRepository;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventRepository;

@ExtendWith(MockitoExtension.class)
class BoothMapServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private EventMapRepository eventMapRepository;

    @Mock
    private BoothMapAreaRepository boothMapAreaRepository;

    @InjectMocks
    private BoothMapService boothMapService;

    @Test
    void 부스_지도_조회_성공() {
        final EventMap eventMap = EventMap.builder()
                .id(10L)
                .eventId(5L)
                .imagePath("https://storage.example.com/map_v1.png")
                .visible(true)
                .build();

        final Booth booth = Booth.builder()
                .id(101L)
                .eventId(5L)
                .name("A-1 민음사")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final BoothMapArea area = BoothMapArea.builder()
                .id(1L)
                .eventMapId(10L)
                .boothId(101L)
                .xRatio(new BigDecimal("0.1050"))
                .yRatio(new BigDecimal("0.2000"))
                .widthRatio(new BigDecimal("0.1450"))
                .heightRatio(new BigDecimal("0.1550"))
                .build();

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(5L)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.findAllByEventIdOrderByIdAsc(5L)).thenReturn(List.of(booth));
        Mockito.when(boothMapAreaRepository.findAllByEventMapIdOrderByIdAsc(10L)).thenReturn(List.of(area));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusIn(101L, List.of(WaitingStatus.WAITING, WaitingStatus.CALLED, WaitingStatus.REGISTERED)))
                .thenReturn(12L);

        final BoothMapResDto result = boothMapService.getBoothMap(5L);

        Assertions.assertThat(result.eventId()).isEqualTo(5L);
        Assertions.assertThat(result.eventMapId()).isEqualTo(10L);
        Assertions.assertThat(result.booths()).hasSize(1);
        Assertions.assertThat(result.booths().get(0).boothId()).isEqualTo(101L);
    }

    @Test
    void 부스_지도_영역_저장_성공() {
        final EventMap eventMap = EventMap.builder()
                .id(10L)
                .eventId(5L)
                .imagePath("https://storage.example.com/map_v1.png")
                .visible(true)
                .build();

        final Booth booth = Booth.builder()
                .id(101L)
                .eventId(5L)
                .name("A-1 민음사")
                .locationCode("A-03")
                .emergencyClosed(false)
                .build();

        final BoothMapArea requestSaved = BoothMapArea.builder()
                .id(1L)
                .eventMapId(10L)
                .boothId(101L)
                .xRatio(new BigDecimal("0.1050"))
                .yRatio(new BigDecimal("0.2000"))
                .widthRatio(new BigDecimal("0.1450"))
                .heightRatio(new BigDecimal("0.1550"))
                .build();

        final BoothMapAreaUpsertReqDto request = BoothMapAreaUpsertReqDto.builder()
                .xRatio(new BigDecimal("0.1050"))
                .yRatio(new BigDecimal("0.2000"))
                .widthRatio(new BigDecimal("0.1450"))
                .heightRatio(new BigDecimal("0.1550"))
                .build();

        Mockito.when(eventMapRepository.findById(10L)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.findById(101L)).thenReturn(Optional.of(booth));
        Mockito.when(boothMapAreaRepository.findByEventMapIdAndBoothId(10L, 101L)).thenReturn(Optional.empty());
        Mockito.when(boothMapAreaRepository.save(ArgumentMatchers.any(BoothMapArea.class))).thenReturn(requestSaved);

        final BoothMapAreaUpsertResDto result = boothMapService.upsertBoothMapArea(10L, 101L, request);

        Assertions.assertThat(result.areaId()).isEqualTo(1L);
        Assertions.assertThat(result.boothId()).isEqualTo(101L);
        Mockito.verify(boothMapAreaRepository).save(ArgumentMatchers.any(BoothMapArea.class));
    }

    @Test
    void 부스_지도_영역_저장_실패_범위_초과() {
        final EventMap eventMap = EventMap.builder()
                .id(10L)
                .eventId(5L)
                .imagePath("https://storage.example.com/map_v1.png")
                .visible(true)
                .build();

        final Booth booth = Booth.builder()
                .id(101L)
                .eventId(5L)
                .name("A-1 민음사")
                .locationCode("A-03")
                .emergencyClosed(false)
                .build();

        Mockito.when(eventMapRepository.findById(10L)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.findById(101L)).thenReturn(Optional.of(booth));

        Assertions.assertThatThrownBy(() -> boothMapService.upsertBoothMapArea(
                        10L,
                        101L,
                        BoothMapAreaUpsertReqDto.builder()
                                .xRatio(new BigDecimal("0.9000"))
                                .yRatio(new BigDecimal("0.2000"))
                                .widthRatio(new BigDecimal("0.2000"))
                                .heightRatio(new BigDecimal("0.1550"))
                                .build()
                )).isInstanceOf(BoothException.class)
                .hasMessage("부스 지도 영역 값이 올바르지 않습니다.");
    }

    @Test
    void 부스_지도_조회_실패_행사_없음() {
        Mockito.when(eventRepository.existsById(5L)).thenReturn(false);

        Assertions.assertThatThrownBy(() -> boothMapService.getBoothMap(5L))
                .isInstanceOf(EventException.class)
                .hasMessage("존재하지 않는 행사입니다.");
    }
}
