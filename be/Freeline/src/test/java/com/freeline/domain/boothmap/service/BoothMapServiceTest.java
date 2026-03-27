package com.freeline.domain.boothmap.service;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.freeline.common.file.dto.FileInfo;
import com.freeline.common.file.service.FileService;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.boothmap.client.AiVisionClient;
import com.freeline.domain.boothmap.dto.request.BoothMapAreaBulkUpsertReqDto;
import com.freeline.domain.boothmap.dto.response.BoothAreaDraftDto;
import com.freeline.domain.boothmap.dto.response.BoothMapResDto;
import com.freeline.domain.boothmap.dto.response.EventMapUploadResDto;
import com.freeline.domain.boothmap.entity.BoothMapArea;
import com.freeline.domain.boothmap.entity.EventMap;
import com.freeline.domain.boothmap.repository.BoothMapAreaRepository;
import com.freeline.domain.boothmap.repository.EventMapRepository;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventRepository;
import com.freeline.domain.waiting.service.WaitingPolicyResolver;

import tools.jackson.databind.ObjectMapper;

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

    @Mock
    private FileService fileService;

    @Mock
    private AiVisionClient aiVisionClient;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private WaitingPolicyResolver waitingPolicyResolver;

    @InjectMocks
    private BoothMapService boothMapService;

    private Event event;

    @BeforeEach
    void setUp() {
        final SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken("1", ""));
        SecurityContextHolder.setContext(context);

        event = Event.builder()
                .id(5L)
                .eventAdminId(1L)
                .build();
    }

    @Test
    void 부스_지도_영역_일괄_저장_성공() {
        final EventMap eventMap = EventMap.builder()
                .id(10L)
                .eventId(5L)
                .imagePath("https://storage.example.com/map_v1.png")
                .visible(false)
                .build();

        final BoothMapAreaBulkUpsertReqDto request = BoothMapAreaBulkUpsertReqDto.builder()
                .eventMapId(10L)
                .areas(List.of(
                        BoothMapAreaBulkUpsertReqDto.AreaItem.builder()
                                .boothId(101L)
                                .xRatio(new BigDecimal("0.1000"))
                                .yRatio(new BigDecimal("0.2000"))
                                .widthRatio(new BigDecimal("0.1500"))
                                .heightRatio(new BigDecimal("0.1500"))
                                .build(),
                        BoothMapAreaBulkUpsertReqDto.AreaItem.builder()
                                .boothId(102L)
                                .xRatio(new BigDecimal("0.3000"))
                                .yRatio(new BigDecimal("0.4000"))
                                .widthRatio(new BigDecimal("0.2000"))
                                .heightRatio(new BigDecimal("0.2000"))
                                .build()
                ))
                .build();

        final EventMap existingVisibleMap = EventMap.builder()
                .id(9L)
                .eventId(5L)
                .imagePath("https://storage.example.com/map_v0.png")
                .visible(true)
                .build();

        final Booth booth1 = Booth.builder().id(101L).build();
        final Booth booth2 = Booth.builder().id(102L).build();

        Mockito.when(eventRepository.findById(5L)).thenReturn(Optional.of(event));
        Mockito.when(eventMapRepository.findById(10L)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.findAllByEventIdOrderByIdAsc(5L)).thenReturn(List.of(booth1, booth2));
        Mockito.when(boothMapAreaRepository.findAllByEventMapIdOrderByIdAsc(10L)).thenReturn(List.of());
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(5L))
                .thenReturn(Optional.of(existingVisibleMap));

        boothMapService.bulkUpsertBoothMapAreas(5L, request);

        Mockito.verify(boothMapAreaRepository).deleteAll(ArgumentMatchers.anyList());
        Mockito.verify(boothMapAreaRepository).saveAll(ArgumentMatchers.anyList());
        Assertions.assertThat(existingVisibleMap.isVisible()).isFalse();
        Assertions.assertThat(eventMap.isVisible()).isTrue();
    }

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

        Mockito.when(eventRepository.findById(5L)).thenReturn(Optional.of(event));
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(5L)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.findAllByEventIdOrderByIdAsc(5L)).thenReturn(List.of(booth));
        Mockito.when(boothMapAreaRepository.findAllByEventMapIdOrderByIdAsc(10L)).thenReturn(List.of(area));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusIn(
                101L,
                List.of(WaitingStatus.WAITING, WaitingStatus.CALLED)
        )).thenReturn(12L);
        Mockito.when(waitingPolicyResolver.resolveStayTimeSeconds(101L, 0)).thenReturn(300);

        final BoothMapResDto result = boothMapService.getBoothMap(5L);

        Assertions.assertThat(result.eventId()).isEqualTo(5L);
        Assertions.assertThat(result.eventMapId()).isEqualTo(10L);
        Assertions.assertThat(result.booths()).hasSize(1);
        Assertions.assertThat(result.booths().get(0).boothId()).isEqualTo(101L);
        Assertions.assertThat(result.booths().get(0).waitingCount()).isEqualTo(12L);
        Assertions.assertThat(result.booths().get(0).estimatedWaitTime()).isEqualTo(60L);
        Assertions.assertThat(result.drafts()).isEmpty();
    }

    @Test
    void 부스_지도_조회_실패_행사_없음() {
        Mockito.when(eventRepository.findById(5L)).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> boothMapService.getBoothMap(5L))
                .isInstanceOf(EventException.class)
                .hasMessage("존재하지 않는 행사입니다.");
    }

    @Test
    void 권한없음_소유권_불일치_예외() {
        final SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken("2", ""));
        SecurityContextHolder.setContext(context);

        Mockito.when(eventRepository.findById(5L)).thenReturn(Optional.of(event));

        Assertions.assertThatThrownBy(() -> boothMapService.getBoothMap(5L))
                .isInstanceOf(EventException.class)
                .hasMessage("요청한 리소스에 접근할 권한이 없습니다.");
    }

    @Test
    void 스냅샷_파싱_조회_테스트() throws Exception {
        final EventMap eventMap = EventMap.builder()
                .id(10L)
                .eventId(5L)
                .imagePath("https://storage.example.com/map_v1.png")
                .visible(true)
                .mappingSnapshot("[{\"xRatio\":0.1}]")
                .build();

        Mockito.when(eventRepository.findById(5L)).thenReturn(Optional.of(event));
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(5L)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.findAllByEventIdOrderByIdAsc(5L)).thenReturn(List.of());
        Mockito.when(boothMapAreaRepository.findAllByEventMapIdOrderByIdAsc(10L)).thenReturn(List.of());
        Mockito.when(objectMapper.readValue(
                ArgumentMatchers.anyString(),
                ArgumentMatchers.eq(BoothAreaDraftDto[].class)
        )).thenReturn(new BoothAreaDraftDto[]{
                BoothAreaDraftDto.builder()
                        .xRatio(new BigDecimal("0.1"))
                        .build()
        });

        final BoothMapResDto result = boothMapService.getBoothMap(5L);

        Assertions.assertThat(result.booths()).isEmpty();
        Assertions.assertThat(result.drafts()).hasSize(1);
    }

    @Test
    void 행사_지도_업로드_시_AI_스냅샷_저장_성공() throws Exception {
        final MockMultipartFile file = new MockMultipartFile(
                "file",
                "map.png",
                "image/png",
                "map".getBytes()
        );
        final FileInfo fileInfo = FileInfo.builder()
                .fileUrl("https://storage.example.com/new_map.png")
                .build();
        final EventMap previousVisibleMap = EventMap.builder()
                .id(9L)
                .eventId(5L)
                .imagePath("https://storage.example.com/old_map.png")
                .visible(true)
                .build();
        final EventMap savedEventMap = EventMap.builder()
                .id(10L)
                .eventId(5L)
                .imagePath("https://storage.example.com/new_map.png")
                .visible(true)
                .build();
        final AiVisionClient.AiAnalysisResult aiAnalysisResult = new AiVisionClient.AiAnalysisResult(
                1000,
                500,
                List.of(new AiVisionClient.AiBoothRect(100, 50, 300, 150))
        );

        Mockito.when(eventRepository.findById(5L)).thenReturn(Optional.of(event));
        Mockito.when(fileService.uploadFile(file, "map")).thenReturn(fileInfo);
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(5L))
                .thenReturn(Optional.of(previousVisibleMap));
        Mockito.when(eventMapRepository.save(ArgumentMatchers.any(EventMap.class))).thenReturn(savedEventMap);
        Mockito.when(aiVisionClient.analyzeMapImage("https://storage.example.com/new_map.png")).thenReturn(aiAnalysisResult);
        Mockito.when(objectMapper.writeValueAsString(ArgumentMatchers.anyList())).thenReturn("[{\"xRatio\":0.1}]");

        final EventMapUploadResDto result = boothMapService.upsertEventMap(5L, file, true);

        Assertions.assertThat(result.eventMapId()).isEqualTo(10L);
        Assertions.assertThat(result.drafts()).hasSize(1);
        Assertions.assertThat(previousVisibleMap.isVisible()).isFalse();
        Mockito.verify(eventMapRepository, Mockito.times(2)).save(ArgumentMatchers.any(EventMap.class));
    }
}
