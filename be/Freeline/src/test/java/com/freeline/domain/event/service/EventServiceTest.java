package com.freeline.domain.event.service;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;

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
import com.freeline.domain.boothmap.entity.EventMap;
import com.freeline.domain.boothmap.repository.EventMapRepository;
import com.freeline.domain.event.dto.request.EventCreateReqDto;
import com.freeline.domain.event.dto.request.EventPolicyReqDto;
import com.freeline.domain.event.dto.request.EventUpdateReqDto;
import com.freeline.domain.event.dto.response.EventDeleteResDto;
import com.freeline.domain.event.dto.response.EventDetailResDto;
import com.freeline.domain.event.dto.response.EventListResDto;
import com.freeline.domain.event.dto.response.EventPolicyResDto;
import com.freeline.domain.event.dto.response.EventResDto;
import com.freeline.domain.event.dto.response.EventUpdateResDto;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventPolicy;
import com.freeline.domain.event.entity.EventStatus;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventPolicyRepository;
import com.freeline.domain.event.repository.EventRepository;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventMapRepository eventMapRepository;

    @Mock
    private EventPolicyRepository eventPolicyRepository;

    @InjectMocks
    private EventService eventService;

    @Test
    void createEvent_success() {
        final EventCreateReqDto request = EventCreateReqDto.builder()
                .name("2026 SSAFY Book Fair")
                .description("Books and goods event")
                .startDate(LocalDate.of(2026, 4, 1))
                .endDate(LocalDate.of(2026, 4, 3))
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .locationAddress("Seoul Gangnam-gu Teheran-ro 123")
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
                .name("2026 SSAFY Conference")
                .description("Conference event")
                .startDate(LocalDate.of(2026, 4, 3))
                .endDate(LocalDate.of(2026, 4, 1))
                .openTime(LocalTime.of(10, 0))
                .closeTime(LocalTime.of(18, 0))
                .locationAddress("Seoul Gangnam-gu Teheran-ro 123")
                .build();

        Assertions.assertThatThrownBy(() -> eventService.createEvent(100L, request))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_EVENT_PERIOD));
    }

    @Test
    void getEvents_successForAllStatus() {
        final PageRequest pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        final Event event = createEvent(1L, 100L, EventStatus.DRAFT);
        setBaseEntityField(event, "createdAt", LocalDateTime.of(2026, 3, 10, 14, 0));

        final Page<Event> eventPage = new PageImpl<>(List.of(event), pageable, 1);
        Mockito.when(eventRepository.findAll(pageable)).thenReturn(eventPage);

        final Page<EventListResDto> result = eventService.getEvents(100L, "ALL", 0, 10);

        Assertions.assertThat(result.getContent()).hasSize(1);
        Assertions.assertThat(result.getContent().getFirst().eventId()).isEqualTo(1L);
        Assertions.assertThat(result.getContent().getFirst().status()).isEqualTo(EventStatus.DRAFT.name());
        Assertions.assertThat(result.getContent().getFirst().thumbnailImageUrl()).isEqualTo("https://cdn.freeline.com/thumb.jpg");
        Mockito.verify(eventRepository).findAll(pageable);
    }

    @Test
    void getEvents_successForStatusFilter() {
        final PageRequest pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        final Event event = createEvent(2L, 100L, EventStatus.OPEN);
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
        final Event event = createEvent(102L, 5L, EventStatus.OPEN);
        setBaseEntityField(event, "createdAt", LocalDateTime.of(2026, 3, 1, 10, 0));
        setBaseEntityField(event, "updatedAt", LocalDateTime.of(2026, 3, 9, 8, 54));

        Mockito.when(eventRepository.findById(102L)).thenReturn(Optional.of(event));

        final EventDetailResDto result = eventService.getEventDetail(5L, 102L, false);

        Assertions.assertThat(result.eventId()).isEqualTo(102L);
        Assertions.assertThat(result.eventAdminId()).isEqualTo(5L);
        Assertions.assertThat(result.name()).isEqualTo("2026 SSAFY Book Fair");
        Assertions.assertThat(result.status()).isEqualTo(EventStatus.OPEN.name());
        Assertions.assertThat(result.booths()).isNull();
        Assertions.assertThat(result.authCode()).isNull();
        Assertions.assertThat(result.mapImageUrl()).isNull();
        Mockito.verify(eventRepository).findById(102L);
    }

    @Test
    void getEventDetail_successWithBooths() {
        final Event event = createEvent(102L, 5L, EventStatus.OPEN);
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
        final Event event = createEvent(102L, 7L, EventStatus.OPEN);
        Mockito.when(eventRepository.findById(102L)).thenReturn(Optional.of(event));

        Assertions.assertThatThrownBy(() -> eventService.getEventDetail(5L, 102L, false))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCESS_DENIED));
    }

    @Test
    void updateEvent_success() {
        final Event event = createEvent(201L, 5L, EventStatus.DRAFT);
        final EventMap eventMap = createEventMap(201L, "https://cdn.freeline.com/maps/event-201.png");
        final LocalDateTime updatedAt = LocalDateTime.of(2026, 3, 12, 9, 30);
        final EventUpdateReqDto request = EventUpdateReqDto.builder()
                .name("2026 SSAFY Open Event")
                .status("OPEN")
                .endDate(LocalDate.of(2026, 4, 5))
                .thumbnailImageUrl("https://cdn.freeline.com/thumb-updated.jpg")
                .build();

        setBaseEntityField(event, "updatedAt", LocalDateTime.of(2026, 3, 11, 9, 0));

        Mockito.when(eventRepository.findById(201L)).thenReturn(Optional.of(event));
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(201L))
                .thenReturn(Optional.of(eventMap));
        Mockito.when(eventRepository.saveAndFlush(event)).thenAnswer(invocation -> {
            setBaseEntityField(event, "updatedAt", updatedAt);
            return event;
        });

        final EventUpdateResDto result = eventService.updateEvent(5L, 201L, false, request);

        Assertions.assertThat(result.eventId()).isEqualTo(201L);
        Assertions.assertThat(result.status()).isEqualTo(EventStatus.OPEN.name());
        Assertions.assertThat(result.updatedAt()).isEqualTo(updatedAt);
        Assertions.assertThat(event.getName()).isEqualTo("2026 SSAFY Open Event");
        Assertions.assertThat(event.getEndDate()).isEqualTo(LocalDate.of(2026, 4, 5));
        Assertions.assertThat(event.getStartDate()).isEqualTo(LocalDate.of(2026, 4, 1));
        Assertions.assertThat(event.getThumbnailImageUrl()).isEqualTo("https://cdn.freeline.com/thumb-updated.jpg");
        Assertions.assertThat(event.getStatus()).isEqualTo(EventStatus.OPEN);
        Mockito.verify(eventRepository).saveAndFlush(event);
    }

    @Test
    void updateEvent_successForValidateOnly() {
        final Event event = createEvent(202L, 5L, EventStatus.DRAFT);
        final EventMap eventMap = createEventMap(202L, "https://cdn.freeline.com/maps/event-202.png");
        final LocalDateTime originalUpdatedAt = LocalDateTime.of(2026, 3, 10, 8, 0);
        final EventUpdateReqDto request = EventUpdateReqDto.builder()
                .name("validated-name")
                .status("OPEN")
                .build();

        setBaseEntityField(event, "updatedAt", originalUpdatedAt);

        Mockito.when(eventRepository.findById(202L)).thenReturn(Optional.of(event));
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(202L))
                .thenReturn(Optional.of(eventMap));

        final EventUpdateResDto result = eventService.updateEvent(5L, 202L, true, request);

        Assertions.assertThat(result.eventId()).isEqualTo(202L);
        Assertions.assertThat(result.status()).isEqualTo(EventStatus.OPEN.name());
        Assertions.assertThat(result.updatedAt()).isEqualTo(originalUpdatedAt);
        Assertions.assertThat(event.getName()).isEqualTo("2026 SSAFY Book Fair");
        Assertions.assertThat(event.getStatus()).isEqualTo(EventStatus.DRAFT);
        Mockito.verify(eventRepository, Mockito.never()).saveAndFlush(Mockito.any(Event.class));
    }

    @Test
    void updateEvent_failWhenAccessDenied() {
        final Event event = createEvent(203L, 7L, EventStatus.DRAFT);
        final EventUpdateReqDto request = EventUpdateReqDto.builder()
                .name("forbidden")
                .build();

        Mockito.when(eventRepository.findById(203L)).thenReturn(Optional.of(event));

        Assertions.assertThatThrownBy(() -> eventService.updateEvent(5L, 203L, false, request))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCESS_DENIED));
    }

    @Test
    void updateEvent_failWhenMapImageMissingForOpen() {
        final Event event = createEvent(204L, 5L, EventStatus.DRAFT);
        final EventUpdateReqDto request = EventUpdateReqDto.builder()
                .status("OPEN")
                .build();

        Mockito.when(eventRepository.findById(204L)).thenReturn(Optional.of(event));
        Mockito.when(eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(204L))
                .thenReturn(Optional.empty());
        Mockito.when(eventMapRepository.findFirstByEventIdOrderByIdDesc(204L))
                .thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> eventService.updateEvent(5L, 204L, false, request))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.MAP_IMAGE_REQUIRED_FOR_OPEN));
    }

    @Test
    void upsertEventPolicy_successWhenCreate() {
        final Event event = createEvent(401L, 5L, EventStatus.DRAFT);
        final LocalDateTime updatedAt = LocalDateTime.of(2026, 3, 12, 11, 0);
        final EventPolicyReqDto request = EventPolicyReqDto.builder()
                .defaultStaySec(300)
                .defaultMaxWaiting(100)
                .defaultCallCount(5)
                .defaultCallTtl(60)
                .defaultDeferLimit(2)
                .build();

        Mockito.when(eventRepository.findById(401L)).thenReturn(Optional.of(event));
        Mockito.when(eventPolicyRepository.findByEvent_Id(401L)).thenReturn(Optional.empty());
        Mockito.when(eventPolicyRepository.saveAndFlush(Mockito.any(EventPolicy.class))).thenAnswer(invocation -> {
            final EventPolicy saved = invocation.getArgument(0);
            setField(saved, "id", 1L);
            setBaseEntityField(saved, "updatedAt", updatedAt);
            return saved;
        });

        final EventPolicyResDto result = eventService.upsertEventPolicy(5L, 401L, request);

        Assertions.assertThat(result.policyId()).isEqualTo(1L);
        Assertions.assertThat(result.eventId()).isEqualTo(401L);
        Assertions.assertThat(result.updatedAt()).isEqualTo(updatedAt);
        Assertions.assertThat(event.getPolicy()).isNotNull();
        Assertions.assertThat(event.getPolicy().getDefaultStaySec()).isEqualTo(300);
        Assertions.assertThat(event.getPolicy().getDefaultMaxWaiting()).isEqualTo(100);
        Assertions.assertThat(event.getPolicy().getDefaultCallCount()).isEqualTo(5);
        Assertions.assertThat(event.getPolicy().getDefaultCallTtl()).isEqualTo(60);
        Assertions.assertThat(event.getPolicy().getDefaultDeferLimit()).isEqualTo(2);
        Mockito.verify(eventPolicyRepository).saveAndFlush(Mockito.any(EventPolicy.class));
    }

    @Test
    void upsertEventPolicy_successWhenUpdate() {
        final Event event = createEvent(402L, 5L, EventStatus.OPEN);
        final EventPolicy existingPolicy = createEventPolicy(11L, event, 180, 80, 3, 30, 1);
        final LocalDateTime updatedAt = LocalDateTime.of(2026, 3, 12, 11, 30);
        final EventPolicyReqDto request = EventPolicyReqDto.builder()
                .defaultStaySec(240)
                .defaultMaxWaiting(120)
                .defaultCallCount(4)
                .defaultCallTtl(45)
                .defaultDeferLimit(3)
                .build();

        Mockito.when(eventRepository.findById(402L)).thenReturn(Optional.of(event));
        Mockito.when(eventPolicyRepository.findByEvent_Id(402L)).thenReturn(Optional.of(existingPolicy));
        Mockito.when(eventPolicyRepository.saveAndFlush(existingPolicy)).thenAnswer(invocation -> {
            setBaseEntityField(existingPolicy, "updatedAt", updatedAt);
            return existingPolicy;
        });

        final EventPolicyResDto result = eventService.upsertEventPolicy(5L, 402L, request);

        Assertions.assertThat(result.policyId()).isEqualTo(11L);
        Assertions.assertThat(result.eventId()).isEqualTo(402L);
        Assertions.assertThat(result.updatedAt()).isEqualTo(updatedAt);
        Assertions.assertThat(existingPolicy.getDefaultStaySec()).isEqualTo(240);
        Assertions.assertThat(existingPolicy.getDefaultMaxWaiting()).isEqualTo(120);
        Assertions.assertThat(existingPolicy.getDefaultCallCount()).isEqualTo(4);
        Assertions.assertThat(existingPolicy.getDefaultCallTtl()).isEqualTo(45);
        Assertions.assertThat(existingPolicy.getDefaultDeferLimit()).isEqualTo(3);
        Mockito.verify(eventPolicyRepository).saveAndFlush(existingPolicy);
    }

    @Test
    void upsertEventPolicy_failWhenAccessDenied() {
        final Event event = createEvent(403L, 7L, EventStatus.DRAFT);
        final EventPolicyReqDto request = EventPolicyReqDto.builder()
                .defaultStaySec(300)
                .defaultMaxWaiting(50)
                .defaultCallCount(5)
                .defaultCallTtl(60)
                .defaultDeferLimit(2)
                .build();

        Mockito.when(eventRepository.findById(403L)).thenReturn(Optional.of(event));

        Assertions.assertThatThrownBy(() -> eventService.upsertEventPolicy(5L, 403L, request))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCESS_DENIED));

        Mockito.verify(eventPolicyRepository, Mockito.never()).findByEvent_Id(Mockito.anyLong());
        Mockito.verify(eventPolicyRepository, Mockito.never()).saveAndFlush(Mockito.any(EventPolicy.class));
    }

    @Test
    void eventPolicyRequest_failValidation() {
        final EventPolicyReqDto request = EventPolicyReqDto.builder()
                .defaultStaySec(0)
                .defaultMaxWaiting(-1)
                .defaultCallCount(-1)
                .defaultCallTtl(-1)
                .defaultDeferLimit(-1)
                .build();

        final Set<ConstraintViolation<EventPolicyReqDto>> violations = Validation.buildDefaultValidatorFactory()
                .getValidator()
                .validate(request);

        Assertions.assertThat(violations).hasSize(5);
        Assertions.assertThat(violations)
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder(
                        "defaultStaySec",
                        "defaultMaxWaiting",
                        "defaultCallCount",
                        "defaultCallTtl",
                        "defaultDeferLimit"
                );
    }

    @Test
    void deleteEvent_success() {
        final Event event = createEvent(301L, 5L, EventStatus.CLOSED);
        Mockito.when(eventRepository.findById(301L)).thenReturn(Optional.of(event));

        final EventDeleteResDto result = eventService.deleteEvent(5L, 301L, true);

        Assertions.assertThat(result.eventId()).isEqualTo(301L);
        Assertions.assertThat(result.deletedAt()).isNotNull();
        Mockito.verify(eventRepository).delete(event);
    }

    @Test
    void deleteEvent_failWhenOpenEvent() {
        final Event event = createEvent(302L, 5L, EventStatus.OPEN);
        Mockito.when(eventRepository.findById(302L)).thenReturn(Optional.of(event));

        Assertions.assertThatThrownBy(() -> eventService.deleteEvent(5L, 302L, false))
                .isInstanceOfSatisfying(EventException.class, ex ->
                        Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.CANNOT_DELETE_OPEN_EVENT));

        Mockito.verify(eventRepository, Mockito.never()).delete(Mockito.any(Event.class));
    }

    private Event createEvent(final Long eventId, final Long eventAdminId, final EventStatus status) {
        return Event.builder()
                .id(eventId)
                .eventAdminId(eventAdminId)
                .name("2026 SSAFY Book Fair")
                .description("IT books and goods exhibition")
                .startDate(LocalDate.of(2026, 4, 1))
                .endDate(LocalDate.of(2026, 4, 3))
                .openTime(LocalTime.of(9, 0))
                .closeTime(LocalTime.of(18, 0))
                .locationAddress("Seoul Gangnam-gu Teheran-ro 212")
                .thumbnailImageUrl("https://cdn.freeline.com/thumb.jpg")
                .status(status)
                .build();
    }

    private EventMap createEventMap(final Long eventId, final String imagePath) {
        return EventMap.builder()
                .id(1L)
                .eventId(eventId)
                .imagePath(imagePath)
                .visible(true)
                .build();
    }

    private EventPolicy createEventPolicy(
            final Long policyId,
            final Event event,
            final Integer defaultStaySec,
            final Integer defaultMaxWaiting,
            final Integer defaultCallCount,
            final Integer defaultCallTtl,
            final Integer defaultDeferLimit
    ) {
        return EventPolicy.builder()
                .id(policyId)
                .event(event)
                .defaultStaySec(defaultStaySec)
                .defaultMaxWaiting(defaultMaxWaiting)
                .defaultCallCount(defaultCallCount)
                .defaultCallTtl(defaultCallTtl)
                .defaultDeferLimit(defaultDeferLimit)
                .build();
    }

    private void setBaseEntityField(final Object target, final String fieldName, final LocalDateTime value) {
        try {
            final Field field = target.getClass().getSuperclass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private void setField(final Object target, final String fieldName, final Object value) {
        try {
            final Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
