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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;
import com.freeline.common.file.service.FileService;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.boothmap.client.AiVisionClient;
import com.freeline.domain.boothmap.dto.request.BoothMapAreaBulkUpsertReqDto;
import com.freeline.domain.boothmap.dto.response.BoothAreaDraftDto;
import com.freeline.domain.boothmap.dto.response.BoothMapResDto;
import com.freeline.domain.boothmap.entity.BoothMapArea;
import com.freeline.domain.boothmap.entity.EventMap;
import com.freeline.domain.boothmap.repository.BoothMapAreaRepository;
import com.freeline.domain.boothmap.repository.EventMapRepository;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventRepository;

import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class BoothMapServiceTest {

    private static final Long EVENT_ADMIN_ID = 1L;
    private static final Long EVENT_ID = 5L;
    private static final Long EVENT_MAP_ID = 10L;

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

    @InjectMocks
    private BoothMapService boothMapService;

    private Event event;

    @BeforeEach
    void setUp() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken("1", ""));
        SecurityContextHolder.setContext(context);

        event = Event.builder()
                .id(5L)
                .eventAdminId(1L)
                .build();
    }

    @Test
    void 부스_지도_영역_일괄_저장이_소유권과_부스소속을_검증한_후_성공한다() {
        final EventMap eventMap = EventMap.builder()
                .id(EVENT_MAP_ID)
                .eventId(EVENT_ID)
                .imagePath("https://storage.example.com/map_v1.png")
                .visible(false)
                .mappingSnapshot("{\"areas\":[{\"xRatio\":0.1}]}")
                .build();

        final EventMap existingVisibleMap = EventMap.builder()
                .id(9L)
                .eventId(EVENT_ID)
                .visible(true)
                .build();

        final BoothMapAreaBulkUpsertReqDto request = createBulkRequest();

        Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(createEvent(EVENT_ADMIN_ID)));
        Mockito.when(eventMapRepository.findById(EVENT_MAP_ID)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.countByIdInAndEventId(List.of(101L, 102L), EVENT_ID)).thenReturn(2L);
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(EVENT_ID))
                .thenReturn(Optional.of(existingVisibleMap));

        boothMapService.bulkUpsertBoothMapAreas(EVENT_ADMIN_ID, EVENT_ID, request);

        Mockito.verify(boothMapAreaRepository).deleteAllByEventMapId(EVENT_MAP_ID);
        Mockito.verify(boothMapAreaRepository).saveAll(ArgumentMatchers.anyList());
        Assertions.assertThat(existingVisibleMap.isVisible()).isFalse();
        Assertions.assertThat(eventMap.isVisible()).isTrue();
        Assertions.assertThat(eventMap.getMappingSnapshot()).isNull();
    }

    @Test
    void 부스_지도_영역_일괄_저장은_행사_소유자가_아니면_실패한다() {
        final BoothMapAreaBulkUpsertReqDto request = createBulkRequest();

        Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(createEvent(999L)));

        Assertions.assertThatThrownBy(() -> boothMapService.bulkUpsertBoothMapAreas(EVENT_ADMIN_ID, EVENT_ID, request))
                .isInstanceOf(AuthException.class)
                .satisfies(exception -> assertErrorCode(exception, ErrorCode.ACCESS_DENIED));
    }

    @Test
    void 부스_지도_영역_일괄_저장은_다른_행사_부스가_포함되면_실패한다() {
        final EventMap eventMap = EventMap.builder()
                .id(EVENT_MAP_ID)
                .eventId(EVENT_ID)
                .imagePath("https://storage.example.com/map_v1.png")
                .visible(true)
                .build();

        final BoothMapAreaBulkUpsertReqDto request = createBulkRequest();

        Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(createEvent(EVENT_ADMIN_ID)));
        Mockito.when(eventMapRepository.findById(EVENT_MAP_ID)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.countByIdInAndEventId(List.of(101L, 102L), EVENT_ID)).thenReturn(1L);

        Assertions.assertThatThrownBy(() -> boothMapService.bulkUpsertBoothMapAreas(EVENT_ADMIN_ID, EVENT_ID, request))
                .isInstanceOf(BoothException.class)
                .satisfies(exception -> assertErrorCode(exception, ErrorCode.BOOTH_EVENT_MISMATCH));
    }

    @Test
    void 부스_지도_조회는_스냅샷을_함께_반환한다() {
        final EventMap eventMap = EventMap.builder()
                .id(EVENT_MAP_ID)
                .eventId(EVENT_ID)
                .imagePath("https://storage.example.com/map_v1.png")
                .visible(true)
                .mappingSnapshot("{\"areas\":[{\"xRatio\":0.1}]}")
                .build();

        final Booth booth = Booth.builder()
                .id(101L)
                .eventId(EVENT_ID)
                .name("A-1 미술관")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final BoothMapArea area = BoothMapArea.builder()
                .id(1L)
                .eventMapId(EVENT_MAP_ID)
                .boothId(101L)
                .xRatio(new BigDecimal("0.1050"))
                .yRatio(new BigDecimal("0.2000"))
                .widthRatio(new BigDecimal("0.1450"))
                .heightRatio(new BigDecimal("0.1550"))
                .build();

        Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(createEvent(EVENT_ADMIN_ID)));
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(EVENT_ID)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.findAllByEventIdOrderByIdAsc(EVENT_ID)).thenReturn(List.of(booth));
        Mockito.when(boothMapAreaRepository.findAllByEventMapIdOrderByIdAsc(EVENT_MAP_ID)).thenReturn(List.of(area));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusIn(
                101L,
                List.of(WaitingStatus.WAITING, WaitingStatus.CALLED, WaitingStatus.REGISTERED)
        )).thenReturn(12L);

        final BoothMapResDto result = boothMapService.getBoothMap(EVENT_ADMIN_ID, EVENT_ID);

        Assertions.assertThat(result.eventId()).isEqualTo(EVENT_ID);
        Assertions.assertThat(result.eventMapId()).isEqualTo(EVENT_MAP_ID);
        Assertions.assertThat(result.mappingSnapshot()).isEqualTo("{\"areas\":[{\"xRatio\":0.1}]}");
        Assertions.assertThat(result.booths()).hasSize(1);
        Assertions.assertThat(result.booths().get(0).boothId()).isEqualTo(101L);
    }

    @Test
    void 부스_지도_조회는_행사가_없으면_실패한다() {
        Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> boothMapService.getBoothMap(EVENT_ADMIN_ID, EVENT_ID))
                .isInstanceOf(EventException.class)
                .satisfies(exception -> assertErrorCode(exception, ErrorCode.EVENT_NOT_FOUND));
    }

    private BoothMapAreaBulkUpsertReqDto createBulkRequest() {
        return BoothMapAreaBulkUpsertReqDto.builder()
                .eventMapId(EVENT_MAP_ID)
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
    }

    private Event createEvent(final Long ownerId) {
        return Event.builder()
                .id(EVENT_ID)
                .eventAdminId(ownerId)
                .build();
    }

    private void assertErrorCode(final Throwable exception, final ErrorCode errorCode) {
        Assertions.assertThat(exception).isInstanceOf(BusinessException.class);
        Assertions.assertThat(((BusinessException) exception).getErrorCode()).isEqualTo(errorCode);
    }

    @Test
    void 권한없음_소유권_불일치_예외() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken("2", "")); // Different user
        SecurityContextHolder.setContext(context);

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);
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
                .build();
        eventMap.updateMappingSnapshot("[{\"xRatio\":0.1}]");

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);
        Mockito.when(eventRepository.findById(5L)).thenReturn(Optional.of(event));
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(5L)).thenReturn(Optional.of(eventMap));
        Mockito.when(boothRepository.findAllByEventIdOrderByIdAsc(5L)).thenReturn(List.of());
        Mockito.when(boothMapAreaRepository.findAllByEventMapIdOrderByIdAsc(10L)).thenReturn(List.of());

        TypeFactory typeFactory = Mockito.mock(TypeFactory.class);
        CollectionType listType = Mockito.mock(CollectionType.class);

        Mockito.when(objectMapper.getTypeFactory()).thenReturn(typeFactory);
        Mockito.when(typeFactory.constructCollectionType(List.class, BoothAreaDraftDto.class)).thenReturn(listType);

        Mockito.when(objectMapper.readValue(ArgumentMatchers.anyString(), ArgumentMatchers.eq(listType)))
                .thenReturn(List.of(BoothAreaDraftDto.builder().xRatio(new BigDecimal("0.1")).build()));

        final BoothMapResDto result = boothMapService.getBoothMap(5L);

        Assertions.assertThat(result.booths()).isEmpty();
        Assertions.assertThat(result.drafts()).hasSize(1);
    }
}
