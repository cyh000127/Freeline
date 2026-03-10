package com.freeline.domain.event.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.freeline.domain.event.dto.request.EventCreateReqDto;
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
	void 행사_생성_성공() {
		// given
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

		when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

		// when
		final EventResDto result = eventService.createEvent(100L, request);

		// then
		assertThat(result.eventId()).isEqualTo(1L);
		assertThat(result.status()).isEqualTo(EventStatus.DRAFT.name());
		verify(eventRepository).save(any(Event.class));
	}

	@Test
	void 행사_생성_실패_종료일이_시작일보다_빠름() {
		// given
		final EventCreateReqDto request = EventCreateReqDto.builder()
			.name("2026 SSAFY 도서 축제")
			.description("다양한 IT 서적과 세미나를 즐길 수 있는 행사입니다.")
			.startDate(LocalDate.of(2026, 4, 3))
			.endDate(LocalDate.of(2026, 4, 1))
			.openTime(LocalTime.of(10, 0))
			.closeTime(LocalTime.of(18, 0))
			.locationAddress("서울특별시 강남구 테헤란로 123")
			.build();

		// when & then
		assertThatThrownBy(() -> eventService.createEvent(100L, request))
			.isInstanceOf(EventException.class)
			.hasMessage("행사 종료일은 시작일보다 빠를 수 없습니다.");
	}

	@Test
	void 행사_목록_조회_성공_ALL_상태() {
		// given
		final PageRequest pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
		final Event event = Event.builder()
			.id(1L)
			.eventAdminId(100L)
			.name("2026 SSAFY 도서 축제")
			.description("설명")
			.startDate(LocalDate.of(2026, 4, 1))
			.endDate(LocalDate.of(2026, 4, 3))
			.openTime(LocalTime.of(10, 0))
			.closeTime(LocalTime.of(18, 0))
			.locationAddress("서울특별시 강남구 테헤란로 123")
			.thumbnailImageUrl(null)
			.status(EventStatus.DRAFT)
			.build();
		setCreatedAt(event, LocalDateTime.of(2026, 3, 10, 14, 0));

		final Page<Event> eventPage = new PageImpl<>(List.of(event), pageable, 1);
		when(eventRepository.findAll(pageable)).thenReturn(eventPage);

		// when
		final Page<EventListResDto> result = eventService.getEvents(100L, "ALL", 0, 10);

		// then
		assertThat(result.getContent()).hasSize(1);
		assertThat(result.getContent().get(0).eventId()).isEqualTo(1L);
		assertThat(result.getContent().get(0).status()).isEqualTo(EventStatus.DRAFT.name());
		assertThat(result.getContent().get(0).thumbnailImageUrl()).isNull();
		verify(eventRepository).findAll(pageable);
	}

	@Test
	void 행사_목록_조회_성공_상태_필터링() {
		// given
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
			.locationAddress("서울특별시 강남구 역삼동 456")
			.thumbnailImageUrl("https://example.com/images/job-fair.png")
			.status(EventStatus.OPEN)
			.build();
		setCreatedAt(event, LocalDateTime.of(2026, 3, 10, 15, 0));

		final Page<Event> eventPage = new PageImpl<>(List.of(event), pageable, 1);
		when(eventRepository.findAllByStatus(EventStatus.OPEN, pageable)).thenReturn(eventPage);

		// when
		final Page<EventListResDto> result = eventService.getEvents(100L, "OPEN", 0, 10);

		// then
		assertThat(result.getContent()).hasSize(1);
		assertThat(result.getContent().get(0).eventId()).isEqualTo(2L);
		assertThat(result.getContent().get(0).status()).isEqualTo(EventStatus.OPEN.name());
		verify(eventRepository).findAllByStatus(EventStatus.OPEN, pageable);
	}

	@Test
	void 행사_목록_조회_실패_잘못된_상태값() {
		// when & then
		assertThatThrownBy(() -> eventService.getEvents(100L, "INVALID", 0, 10))
			.isInstanceOf(EventException.class)
			.hasMessage("유효하지 않은 입력값입니다.");
	}

	private void setCreatedAt(final Event event, final LocalDateTime createdAt) {
		try {
			final java.lang.reflect.Field field = event.getClass().getSuperclass().getDeclaredField("createdAt");
			field.setAccessible(true);
			field.set(event, createdAt);
		} catch (ReflectiveOperationException ex) {
			throw new IllegalStateException(ex);
		}
	}
}
