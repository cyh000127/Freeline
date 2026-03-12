package com.freeline.domain.event.service;

import java.util.Collections;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.event.converter.EventConverter;
import com.freeline.domain.event.dto.request.EventCreateReqDto;
import com.freeline.domain.event.dto.response.EventDetailResDto;
import com.freeline.domain.event.dto.response.EventListResDto;
import com.freeline.domain.event.dto.response.EventResDto;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventStatus;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventRepository;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public EventResDto createEvent(final Long eventAdminId, final EventCreateReqDto request) {
        validateEventPeriod(request);

        final Event event = EventConverter.toEntity(eventAdminId, request, EventStatus.DRAFT);
        final Event saved = eventRepository.save(event);

        log.info("[Event] 생성 완료 {id: {}, adminId: {}, status: {}}",
                saved.getId(),
                saved.getEventAdminId(),
                saved.getStatus());

        return EventConverter.toEventResDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<EventListResDto> getEvents(
            final Long eventAdminId,
            final String status,
            final int page,
            final int size
    ) {
        final Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        final Page<Event> eventPage;

        if ("ALL".equalsIgnoreCase(status)) {
            eventPage = eventRepository.findAll(pageable);
        } else {
            final EventStatus eventStatus = parseEventStatus(status);
            eventPage = eventRepository.findAllByStatus(eventStatus, pageable);
        }

        return eventPage.map(EventConverter::toEventListResDto);
    }

    @Transactional(readOnly = true)
    public EventDetailResDto getEventDetail(
            final Long eventAdminId,
            final Long eventId,
            final Boolean includeBooths
    ) {
        final Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_NOT_FOUND));

        validateEventOwnership(eventAdminId, event);

        return EventConverter.toEventDetailResDto(
                event,
                Boolean.TRUE.equals(includeBooths) ? Collections.emptyList() : null
        );
    }

    private void validateEventPeriod(final EventCreateReqDto request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new EventException(ErrorCode.INVALID_EVENT_PERIOD);
        }
    }

    private void validateEventOwnership(final Long eventAdminId, final Event event) {
        if (!event.getEventAdminId().equals(eventAdminId)) {
            throw new EventException(ErrorCode.ACCESS_DENIED);
        }
    }

    private EventStatus parseEventStatus(final String status) {
        try {
            return EventStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new EventException(ErrorCode.INVALID_INPUT);
        }
    }
}
