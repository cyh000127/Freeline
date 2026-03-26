package com.freeline.domain.booth.service;

import java.time.LocalDateTime;
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

import com.freeline.common.file.service.FileService;
import com.freeline.domain.booth.dto.request.BoothCreateReqDto;
import com.freeline.domain.booth.dto.request.BoothPolicyUpdateReqDto;
import com.freeline.domain.booth.dto.request.BoothStatusUpdateReqDto;
import com.freeline.domain.booth.dto.request.BoothUpdateReqDto;
import com.freeline.domain.booth.dto.response.BoothCreateResDto;
import com.freeline.domain.booth.dto.response.BoothPolicyResDto;
import com.freeline.domain.booth.dto.response.BoothQueueResDto;
import com.freeline.domain.booth.dto.response.BoothResDto;
import com.freeline.domain.booth.dto.response.BoothSearchResDto;
import com.freeline.domain.booth.dto.response.BoothStatusResDto;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothGoods;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.Visitor;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothGoodsRepository;
import com.freeline.domain.booth.repository.BoothImageRepository;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventPolicy;
import com.freeline.domain.event.entity.EventStatus;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventPolicyRepository;
import com.freeline.domain.event.repository.EventRepository;

@ExtendWith(MockitoExtension.class)
class BoothServiceTest {

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private BoothGoodsRepository boothGoodsRepository;

    @Mock
    private BoothPolicyRepository boothPolicyRepository;

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private BoothImageRepository boothImageRepository;

    @Mock
    private EventPolicyRepository eventPolicyRepository;

    @Mock
    private FileService fileService;

    @InjectMocks
    private BoothService boothService;

    @Test
    void 부스_검색_성공() {
        final Object[] row1 = {101L, "A-1 민음사", "김싸피", "민음사 출판그룹"};
        final Object[] row2 = {102L, "A-2 문학동네", "이싸피", null};

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);
        Mockito.when(boothRepository.searchBoothsByKeyword(5L, "민음"))
                .thenReturn(List.of(row1, row2));

        final List<BoothSearchResDto> result = boothService.searchBooths(5L, "민음");

        Assertions.assertThat(result).hasSize(2);
        Assertions.assertThat(result.get(0).boothId()).isEqualTo(101L);
        Assertions.assertThat(result.get(0).boothName()).isEqualTo("A-1 민음사");
        Assertions.assertThat(result.get(0).adminName()).isEqualTo("김싸피");
        Assertions.assertThat(result.get(0).company()).isEqualTo("민음사 출판그룹");
        Assertions.assertThat(result.get(1).company()).isNull();
    }

    @Test
    void 부스_등록_성공() {
        final BoothCreateReqDto request = BoothCreateReqDto.builder()
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .build();

        final Booth savedBooth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name(request.name())
                .locationCode(request.locationCode())
                .openTime(request.openTime())
                .closeTime(request.closeTime())
                .emergencyClosed(false)
                .build();

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);
        Mockito.when(boothRepository.save(ArgumentMatchers.any(Booth.class))).thenReturn(savedBooth);

        final BoothCreateResDto result = boothService.createBooth(5L, request);

        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.eventId()).isEqualTo(5L);
        Mockito.verify(boothRepository).save(ArgumentMatchers.any(Booth.class));
    }

    @Test
    void 부스_등록_실패_행사_없음() {
        final BoothCreateReqDto request = BoothCreateReqDto.builder()
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .build();

        Mockito.when(eventRepository.existsById(5L)).thenReturn(false);

        Assertions.assertThatThrownBy(() -> boothService.createBooth(5L, request))
                .isInstanceOf(EventException.class)
                .hasMessage("존재하지 않는 행사입니다.");
    }

    @Test
    void 부스_상세_조회_성공() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final BoothPolicy boothPolicy = BoothPolicy.builder()
                .id(1L)
                .boothId(12L)
                .callCount(5)
                .callValidTime(180)
                .build();

        final BoothGoods boothGoods = BoothGoods.builder()
                .id(101L)
                .boothId(12L)
                .name("키링")
                .imagePath("https://cdn.freeline.com/goods/keyring.png")
                .soldOut(false)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatus(12L, WaitingStatus.WAITING)).thenReturn(35L);
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(boothPolicy));
        Mockito.when(boothGoodsRepository.findAllByBoothIdOrderByIdAsc(12L)).thenReturn(List.of(boothGoods));

        final BoothResDto result = boothService.getBooth(12L);

        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.waitingCount()).isEqualTo(35L);
        Assertions.assertThat(result.callCount()).isEqualTo(5);
        Assertions.assertThat(result.goods()).hasSize(1);
    }

    @Test
    void 부스_상세_조회_성공_whenEventPolicyFallbackApplies() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final EventPolicy eventPolicy = EventPolicy.builder()
                .id(1L)
                .event(Event.builder().id(5L).build())
                .defaultCallCount(3)
                .defaultCallTtl(120)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatus(12L, WaitingStatus.WAITING)).thenReturn(35L);
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.empty());
        Mockito.when(eventPolicyRepository.findByEvent_Id(5L)).thenReturn(Optional.of(eventPolicy));
        Mockito.when(boothGoodsRepository.findAllByBoothIdOrderByIdAsc(12L)).thenReturn(List.of());

        final BoothResDto result = boothService.getBooth(12L);

        Assertions.assertThat(result.callCount()).isEqualTo(3);
        Assertions.assertThat(result.callValidSeconds()).isEqualTo(120);
    }

    @Test
    void 부스_상세_조회_성공_whenNoPolicyUsesRuntimeDefaults() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatus(12L, WaitingStatus.WAITING)).thenReturn(35L);
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.empty());
        Mockito.when(eventPolicyRepository.findByEvent_Id(5L)).thenReturn(Optional.empty());
        Mockito.when(boothGoodsRepository.findAllByBoothIdOrderByIdAsc(12L)).thenReturn(List.of());

        final BoothResDto result = boothService.getBooth(12L);

        Assertions.assertThat(result.callCount()).isEqualTo(1);
        Assertions.assertThat(result.callValidSeconds()).isEqualTo(180);
    }

    @Test
    void 부스_대기열_현황_조회_성공() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final BoothPolicy boothPolicy = BoothPolicy.builder()
                .id(1L)
                .boothId(12L)
                .callCount(5)
                .callValidTime(180)
                .build();

        final Visitor visitor = Visitor.builder()
                .id(100L)
                .name("홍길동")
                .active(true)
                .build();

        final BoothWaiting calledWaiting = BoothWaiting.builder()
                .id(1001L)
                .boothId(12L)
                .visitorId(100L)
                .status(WaitingStatus.CALLED)
                .waitingNumber(15)
                .calledAt(LocalDateTime.of(2026, 3, 8, 21, 10, 0))
                .visitor(visitor)
                .build();

        final BoothWaiting registeredWaiting = BoothWaiting.builder()
                .id(1002L)
                .boothId(12L)
                .visitorId(100L)
                .status(WaitingStatus.REGISTERED)
                .waitingNumber(16)
                .calledAt(LocalDateTime.of(2026, 3, 8, 21, 12, 0))
                .visitor(visitor)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(boothPolicy));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatus(12L, WaitingStatus.WAITING)).thenReturn(57L);
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusIn(12L, List.of(WaitingStatus.CALLED, WaitingStatus.REGISTERED)))
                .thenReturn(2L);
        Mockito.when(boothWaitingRepository.findAllByBoothIdAndStatusInOrderByWaitingNumberAsc(
                12L,
                List.of(WaitingStatus.CALLED, WaitingStatus.REGISTERED)
        )).thenReturn(List.of(calledWaiting, registeredWaiting));
        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndStatusOrderByCalledAtDesc(12L, WaitingStatus.CALLED))
                .thenReturn(Optional.of(calledWaiting));

        final BoothQueueResDto result = boothService.getBoothQueue(12L);

        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.backQueueCount()).isEqualTo(57L);
        Assertions.assertThat(result.frontQueueCount()).isEqualTo(2L);
        Assertions.assertThat(result.frontQueue()).hasSize(2);
        Assertions.assertThat(result.currentCalledUser()).isNotNull();
        Assertions.assertThat(result.currentCalledUser().waitingId()).isEqualTo(1001L);
    }

    @Test
    void 부스_대기열_현황_조회_성공_whenNoPolicyUsesRuntimeDefaultFrontQueueLimit() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final Visitor visitor = Visitor.builder()
                .id(100L)
                .name("홍길동")
                .active(true)
                .build();

        final BoothWaiting calledWaiting = BoothWaiting.builder()
                .id(1001L)
                .boothId(12L)
                .visitorId(100L)
                .status(WaitingStatus.CALLED)
                .waitingNumber(15)
                .calledAt(LocalDateTime.of(2026, 3, 8, 21, 10, 0))
                .visitor(visitor)
                .build();

        final BoothWaiting registeredWaiting = BoothWaiting.builder()
                .id(1002L)
                .boothId(12L)
                .visitorId(100L)
                .status(WaitingStatus.REGISTERED)
                .waitingNumber(16)
                .calledAt(LocalDateTime.of(2026, 3, 8, 21, 12, 0))
                .visitor(visitor)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.empty());
        Mockito.when(eventPolicyRepository.findByEvent_Id(5L)).thenReturn(Optional.empty());
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatus(12L, WaitingStatus.WAITING)).thenReturn(57L);
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusIn(12L, List.of(WaitingStatus.CALLED, WaitingStatus.REGISTERED)))
                .thenReturn(2L);
        Mockito.when(boothWaitingRepository.findAllByBoothIdAndStatusInOrderByWaitingNumberAsc(
                12L,
                List.of(WaitingStatus.CALLED, WaitingStatus.REGISTERED)
        )).thenReturn(List.of(calledWaiting, registeredWaiting));
        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndStatusOrderByCalledAtDesc(12L, WaitingStatus.CALLED))
                .thenReturn(Optional.of(calledWaiting));

        final BoothQueueResDto result = boothService.getBoothQueue(12L);

        Assertions.assertThat(result.frontQueueCount()).isEqualTo(2L);
        Assertions.assertThat(result.frontQueue()).hasSize(1);
    }

    @Test
    void 부스_대기열_현황_조회_성공_whenEventPolicyFallbackApplies() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final EventPolicy eventPolicy = EventPolicy.builder()
                .id(1L)
                .event(Event.builder().id(5L).build())
                .defaultCallCount(1)
                .defaultCallTtl(120)
                .build();

        final Visitor visitor = Visitor.builder()
                .id(100L)
                .name("홍길동")
                .active(true)
                .build();

        final BoothWaiting calledWaiting = BoothWaiting.builder()
                .id(1001L)
                .boothId(12L)
                .visitorId(100L)
                .status(WaitingStatus.CALLED)
                .waitingNumber(15)
                .calledAt(LocalDateTime.of(2026, 3, 8, 21, 10, 0))
                .visitor(visitor)
                .build();

        final BoothWaiting registeredWaiting = BoothWaiting.builder()
                .id(1002L)
                .boothId(12L)
                .visitorId(100L)
                .status(WaitingStatus.REGISTERED)
                .waitingNumber(16)
                .calledAt(LocalDateTime.of(2026, 3, 8, 21, 12, 0))
                .visitor(visitor)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.empty());
        Mockito.when(eventPolicyRepository.findByEvent_Id(5L)).thenReturn(Optional.of(eventPolicy));
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatus(12L, WaitingStatus.WAITING)).thenReturn(57L);
        Mockito.when(boothWaitingRepository.countByBoothIdAndStatusIn(12L, List.of(WaitingStatus.CALLED, WaitingStatus.REGISTERED)))
                .thenReturn(2L);
        Mockito.when(boothWaitingRepository.findAllByBoothIdAndStatusInOrderByWaitingNumberAsc(
                12L,
                List.of(WaitingStatus.CALLED, WaitingStatus.REGISTERED)
        )).thenReturn(List.of(calledWaiting, registeredWaiting));
        Mockito.when(boothWaitingRepository.findFirstByBoothIdAndStatusOrderByCalledAtDesc(12L, WaitingStatus.CALLED))
                .thenReturn(Optional.of(calledWaiting));

        final BoothQueueResDto result = boothService.getBoothQueue(12L);

        Assertions.assertThat(result.frontQueue()).hasSize(1);
        Assertions.assertThat(result.frontQueue().getFirst().waitingId()).isEqualTo(1001L);
    }

    @Test
    void 부스_운영_상태_변경_성공() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));

        final BoothStatusResDto result = boothService.updateBoothStatus(
                12L,
                BoothStatusUpdateReqDto.builder()
                        .isEmergencyClosed(true)
                        .build()
        );

        Assertions.assertThat(result.isEmergencyClosed()).isTrue();
    }

    @Test
    void 부스_정책_조회_성공_부스_정책_우선() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final BoothPolicy boothPolicy = BoothPolicy.builder()
                .id(1L)
                .boothId(12L)
                .stayTime(300)
                .maxWaitingCount(50)
                .callCount(3)
                .callValidTime(120)
                .deferLimit(1)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(boothPolicy));

        final BoothPolicyResDto result = boothService.getBoothPolicy(12L);

        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.staySeconds()).isEqualTo(300);
        Assertions.assertThat(result.maxWaitingCount()).isEqualTo(50);
        Assertions.assertThat(result.callCount()).isEqualTo(3);
        Assertions.assertThat(result.callValidSeconds()).isEqualTo(120);
        Assertions.assertThat(result.deferLimit()).isEqualTo(1);
        Mockito.verify(eventPolicyRepository, Mockito.never()).findByEvent_Id(Mockito.anyLong());
    }

    @Test
    void 부스_정책_조회_성공_행사_정책_폴백() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final Event event = Event.builder()
                .id(5L)
                .eventAdminId(1L)
                .name("행사")
                .description("설명")
                .startDate(java.time.LocalDate.of(2026, 3, 24))
                .endDate(java.time.LocalDate.of(2026, 3, 27))
                .openTime(LocalTime.of(9, 0))
                .closeTime(LocalTime.of(18, 0))
                .locationAddress("서울")
                .status(EventStatus.OPEN)
                .build();

        final EventPolicy eventPolicy = EventPolicy.builder()
                .id(1L)
                .event(event)
                .defaultStaySec(600)
                .defaultMaxWaiting(100)
                .defaultCallCount(5)
                .defaultCallTtl(180)
                .defaultDeferLimit(2)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.empty());
        Mockito.when(eventPolicyRepository.findByEvent_Id(5L)).thenReturn(Optional.of(eventPolicy));

        final BoothPolicyResDto result = boothService.getBoothPolicy(12L);

        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.staySeconds()).isEqualTo(600);
        Assertions.assertThat(result.maxWaitingCount()).isEqualTo(100);
        Assertions.assertThat(result.callCount()).isEqualTo(5);
        Assertions.assertThat(result.callValidSeconds()).isEqualTo(180);
        Assertions.assertThat(result.deferLimit()).isEqualTo(2);
    }

    @Test
    void 부스_정책_설정_성공_신규_생성() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final BoothPolicy savedPolicy = BoothPolicy.builder()
                .id(1L)
                .boothId(12L)
                .stayTime(600)
                .maxWaitingCount(100)
                .callCount(5)
                .callValidTime(180)
                .deferLimit(2)
                .build();

        final BoothPolicyUpdateReqDto request = BoothPolicyUpdateReqDto.builder()
                .staySeconds(600)
                .maxWaitingCount(100)
                .callCount(5)
                .callValidSeconds(180)
                .deferLimit(2)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.empty());
        Mockito.when(boothPolicyRepository.save(ArgumentMatchers.any(BoothPolicy.class))).thenReturn(savedPolicy);

        final BoothPolicyResDto result = boothService.upsertBoothPolicy(12L, request);

        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.staySeconds()).isEqualTo(600);
        Assertions.assertThat(result.maxWaitingCount()).isEqualTo(100);
        Assertions.assertThat(result.callCount()).isEqualTo(5);
        Assertions.assertThat(result.callValidSeconds()).isEqualTo(180);
        Assertions.assertThat(result.deferLimit()).isEqualTo(2);
        Mockito.verify(boothPolicyRepository).save(ArgumentMatchers.any(BoothPolicy.class));
    }

    @Test
    void 부스_정책_설정_성공_기존값_수정() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        final BoothPolicy existingPolicy = BoothPolicy.builder()
                .id(1L)
                .boothId(12L)
                .stayTime(300)
                .maxWaitingCount(50)
                .callCount(3)
                .callValidTime(120)
                .deferLimit(1)
                .build();

        final BoothPolicyUpdateReqDto request = BoothPolicyUpdateReqDto.builder()
                .staySeconds(600)
                .maxWaitingCount(100)
                .callCount(5)
                .callValidSeconds(180)
                .deferLimit(2)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));
        Mockito.when(boothPolicyRepository.findByBoothId(12L)).thenReturn(Optional.of(existingPolicy));

        final BoothPolicyResDto result = boothService.upsertBoothPolicy(12L, request);

        Assertions.assertThat(result.boothId()).isEqualTo(12L);
        Assertions.assertThat(result.staySeconds()).isEqualTo(600);
        Assertions.assertThat(result.maxWaitingCount()).isEqualTo(100);
        Assertions.assertThat(result.callCount()).isEqualTo(5);
        Assertions.assertThat(result.callValidSeconds()).isEqualTo(180);
        Assertions.assertThat(result.deferLimit()).isEqualTo(2);
        Mockito.verify(boothPolicyRepository, Mockito.never()).save(ArgumentMatchers.any(BoothPolicy.class));
    }

    @Test
    void 부스_정보_수정_실패_운영_시간_오류() {
        final Booth booth = Booth.builder()
                .id(12L)
                .eventId(5L)
                .name("SSAFY 굿즈 부스")
                .locationCode("A-03")
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .emergencyClosed(false)
                .build();

        Mockito.when(boothRepository.findById(12L)).thenReturn(Optional.of(booth));

        Assertions.assertThatThrownBy(() -> boothService.updateBooth(
                        12L,
                        BoothUpdateReqDto.builder()
                                .name("SSAFY 공식 굿즈 부스")
                                .locationCode("A-05")
                                .openTime(LocalTime.of(18, 0))
                                .closeTime(LocalTime.of(10, 0))
                                .build()
                )).isInstanceOf(BoothException.class)
                .hasMessage("부스 종료 시간은 시작 시간보다 늦어야 합니다.");
    }
}
