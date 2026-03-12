package com.freeline.domain.event.service;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.event.dto.request.EventCreateReqDto;
import com.freeline.domain.event.dto.response.EventDetailResDto;
import com.freeline.domain.event.dto.response.EventListResDto;
import com.freeline.domain.event.dto.response.EventResDto;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventStatus;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventRepository;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventService eventService;

    @Test
    void createEvent_success() {
        final EventCreateReqDto request = EventCreateReqDto.builder()
                .name("2026 SSAFY 도서 축제")
                .description("다양한 IT 서적과 세미나를 즐길 수 있는 행사입니다.")
                .startDate(LocalDate.of(2026, 4, 1))
                .endDate(LocalDate.of(2026, 4, 3))
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .locationAddress("서울특별시 강남구 테헤란로 123")
                .thumbnailImageUrl("https://example.com/images/event-thumbnail.png")
                .build();

        final Event savedEvent = Event.builder()
                .id(1L)
                .eventAdminId(100L)
                .name(request.name())
                .description(request.description())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .openTime(request.openTime())
                .closeTime(request.closeTime())
                .locationAddress(request.locationAddress())
                .thumbnailImageUrl(request.thumbnailImageUrl())
                .status(EventStatus.DRAFT)
                .build();

        Mockito.when(eventRepository.save(Mockito.any(Event.class))).thenReturn(savedEvent);

        final EventResDto result = eventService.createEvent(100L, request);

        Assertions.assertThat(result.eventId()).isEqualTo(1L);
        Assertions.assertThat(result.status()).isEqualTo(EventStatus.DRAFT.name());
        Mockito.verify(eventRepository).save(Mockito.any(Event.class));
    }

    @Test
    void createEvent_failWhenEndDateBeforeStartDate() {
        final EventCreateReqDto request = EventCreateReqDto.builder()
                .name("2026 SSAFY 컨퍼런스")
                .description("다양한 IT 지식과 네트워킹을 즐길 수 있는 행사입니다.")
                .startDate(LocalDate.of(2026, 4, 3))
                .endDate(LocalDate.of(2026, 4, 1))
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .locationAddress("서울특별시 강남구 테헤란로 123")
                .build();

        Assertions.assertThatThrownBy(() -> eventService.createEvent(100L, request))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_EVENT_PERIOD));
    }

    @Test
    void getEvents_successForAllStatus() {
        final PageRequest pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        final Event event = Event.builder()
                .id(1L)
                .eventAdminId(100L)
                .name("2026 SSAFY 컨퍼런스")
                .description("설명")
                .startDate(LocalDate.of(2026, 4, 1))
                .endDate(LocalDate.of(2026, 4, 3))
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .locationAddress("서울특별시 강남구 테헤란로 123")
                .thumbnailImageUrl(null)
                .status(EventStatus.DRAFT)
                .build();
        setBaseEntityField(event, "createdAt", LocalDateTime.of(2026, 3, 10, 14, 0));

        final Page<Event> eventPage = new PageImpl<>(List.of(event), pageable, 1);
        Mockito.when(eventRepository.findAll(pageable)).thenReturn(eventPage);

        final Page<EventListResDto> result = eventService.getEvents(100L, "ALL", 0, 10);

        Assertions.assertThat(result.getContent()).hasSize(1);
        Assertions.assertThat(result.getContent().getFirst().eventId()).isEqualTo(1L);
        Assertions.assertThat(result.getContent().getFirst().status()).isEqualTo(EventStatus.DRAFT.name());
        Assertions.assertThat(result.getContent().getFirst().thumbnailImageUrl()).isNull();
        Mockito.verify(eventRepository).findAll(pageable);
    }

    @Test
    void getEvents_successForStatusFilter() {
        final PageRequest pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        final Event event = Event.builder()
                .id(2L)
                .eventAdminId(100L)
                .name("2026 SSAFY 취업 박람회")
                .description("설명")
                .startDate(LocalDate.of(2026, 5, 1))
                .endDate(LocalDate.of(2026, 5, 2))
                .openTime(LocalTime.of(9, 0))
                .closeTime(LocalTime.of(17, 0))
                .locationAddress("서울특별시 강남구 삼성로 456")
                .thumbnailImageUrl("https://example.com/images/job-fair.png")
                .status(EventStatus.OPEN)
                .build();
        setBaseEntityField(event, "createdAt", LocalDateTime.of(2026, 3, 10, 15, 0));

        final Page<Event> eventPage = new PageImpl<>(List.of(event), pageable, 1);
        Mockito.when(eventRepository.findAllByStatus(EventStatus.OPEN, pageable)).thenReturn(eventPage);

        final Page<EventListResDto> result = eventService.getEvents(100L, "OPEN", 0, 10);

        Assertions.assertThat(result.getContent()).hasSize(1);
        Assertions.assertThat(result.getContent().getFirst().eventId()).isEqualTo(2L);
        Assertions.assertThat(result.getContent().getFirst().status()).isEqualTo(EventStatus.OPEN.name());
        Mockito.verify(eventRepository).findAllByStatus(EventStatus.OPEN, pageable);
    }

    @Test
    void getEvents_failForInvalidStatus() {
        Assertions.assertThatThrownBy(() -> eventService.getEvents(100L, "INVALID", 0, 10))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_INPUT));
    }

    @Test
    void getEventDetail_successWithoutBooths() {
        final Event event = createOpenEvent(102L, 5L);
        setBaseEntityField(event, "createdAt", LocalDateTime.of(2026, 3, 1, 10, 0));
        setBaseEntityField(event, "updatedAt", LocalDateTime.of(2026, 3, 9, 8, 54));

        Mockito.when(eventRepository.findById(102L)).thenReturn(Optional.of(event));

        final EventDetailResDto result = eventService.getEventDetail(5L, 102L, false);

        Assertions.assertThat(result.eventId()).isEqualTo(102L);
        Assertions.assertThat(result.eventAdminId()).isEqualTo(5L);
        Assertions.assertThat(result.name()).isEqualTo("2026 SSAFY 도서 축제");
        Assertions.assertThat(result.status()).isEqualTo(EventStatus.OPEN.name());
        Assertions.assertThat(result.booths()).isNull();
        Assertions.assertThat(result.authCode()).isNull();
        Assertions.assertThat(result.mapImageUrl()).isNull();
        Mockito.verify(eventRepository).findById(102L);
    }

    @Test
    void getEventDetail_successWithBooths() {
        final Event event = createOpenEvent(102L, 5L);
        Mockito.when(eventRepository.findById(102L)).thenReturn(Optional.of(event));

        final EventDetailResDto result = eventService.getEventDetail(5L, 102L, true);

        Assertions.assertThat(result.booths()).isNotNull().isEmpty();
        Mockito.verify(eventRepository).findById(102L);
    }

    @Test
    void getEventDetail_failWhenEventNotFound() {
        Mockito.when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> eventService.getEventDetail(5L, 999L, false))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.EVENT_NOT_FOUND));
    }

    @Test
    void getEventDetail_failWhenAccessDenied() {
        final Event event = createOpenEvent(102L, 7L);
        Mockito.when(eventRepository.findById(102L)).thenReturn(Optional.of(event));

        Assertions.assertThatThrownBy(() -> eventService.getEventDetail(5L, 102L, false))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCESS_DENIED));
    }

    private Event createOpenEvent(final Long eventId, final Long eventAdminId) {
        return Event.builder()
                .id(eventId)
                .eventAdminId(eventAdminId)
                .name("2026 SSAFY 도서 축제")
                .description("IT 서적과 굿즈를 만날 수 있는 특별한 전시회입니다.")
                .startDate(LocalDate.of(2026, 4, 1))
                .endDate(LocalDate.of(2026, 4, 3))
                .openTime(LocalTime.of(9, 0))
                .closeTime(LocalTime.of(18, 0))
                .locationAddress("서울특별시 강남구 테헤란로 212")
                .thumbnailImageUrl("https://cdn.freeline.com/thumb.jpg")
                .status(EventStatus.OPEN)
                .build();
    }

    private void setBaseEntityField(final Event event, final String fieldName, final LocalDateTime value) {
        try {
            final Field field = event.getClass().getSuperclass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(event, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
