package com.freeline.domain.event.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.boothmap.entity.EventMap;
import com.freeline.domain.boothmap.repository.EventMapRepository;
import com.freeline.domain.event.converter.EventConverter;
import com.freeline.domain.event.converter.EventPolicyConverter;
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

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventMapRepository eventMapRepository;
    private final EventPolicyRepository eventPolicyRepository;

    public EventResDto createEvent(final Long eventAdminId, final EventCreateReqDto request) {
        validateEventPeriod(request.startDate(), request.endDate());

        final Event event = EventConverter.toEntity(eventAdminId, request, EventStatus.DRAFT);
        final Event saved = eventRepository.save(event);

        log.info("[Event] create completed {id: {}, adminId: {}, status: {}}",
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
        final Event event = getAuthorizedEvent(eventAdminId, eventId);

        return EventConverter.toEventDetailResDto(
                event,
                Boolean.TRUE.equals(includeBooths) ? Collections.emptyList() : null
        );
    }

    public EventUpdateResDto updateEvent(
            final Long eventAdminId,
            final Long eventId,
            final Boolean validateOnly,
            final EventUpdateReqDto request
    ) {
        final Event event = getAuthorizedEvent(eventAdminId, eventId);
        final EventStatus requestedStatus = parseEventStatus(request.status());
        final LocalDate nextStartDate = request.startDate() != null ? request.startDate() : event.getStartDate();
        final LocalDate nextEndDate = request.endDate() != null ? request.endDate() : event.getEndDate();

        validateEventPeriod(nextStartDate, nextEndDate);

        if (requestedStatus == EventStatus.OPEN) {
            validateMapImageForOpen(eventId);
        }

        if (Boolean.TRUE.equals(validateOnly)) {
            final EventStatus responseStatus = requestedStatus != null ? requestedStatus : event.getStatus();
            return EventConverter.toEventUpdateResDto(event.getId(), responseStatus, event.getUpdatedAt());
        }

        event.update(
                request.name(),
                request.startDate(),
                request.endDate(),
                request.openTime(),
                request.closeTime(),
                request.locationAddress(),
                request.thumbnailImageUrl(),
                requestedStatus
        );

        final Event saved = eventRepository.saveAndFlush(event);

        log.info("[Event] update completed {id: {}, adminId: {}, status: {}, validateOnly: false}",
                saved.getId(),
                saved.getEventAdminId(),
                saved.getStatus());

        return EventConverter.toEventUpdateResDto(saved);
    }

    public EventPolicyResDto upsertEventPolicy(
            final Long eventAdminId,
            final Long eventId,
            final EventPolicyReqDto request
    ) {
        final Event event = getAuthorizedEvent(eventAdminId, eventId);

        final EventPolicy eventPolicy = eventPolicyRepository.findByEvent_Id(eventId)
                .map(existingPolicy -> {
                    existingPolicy.updatePolicy(
                            request.defaultStaySec(),
                            request.defaultMaxWaiting(),
                            request.defaultCallCount(),
                            request.defaultCallTtl(),
                            request.defaultDeferLimit()
                    );
                    return existingPolicy;
                })
                .orElseGet(() -> {
                    final EventPolicy newPolicy = EventPolicyConverter.toEntity(event, request);
                    event.assignPolicy(newPolicy);
                    return newPolicy;
                });

        final EventPolicy saved = eventPolicyRepository.saveAndFlush(eventPolicy);

        log.info("[EventPolicy] upsert completed {policyId: {}, eventId: {}, adminId: {}}",
                saved.getId(),
                eventId,
                eventAdminId);

        return EventPolicyConverter.toEventPolicyResDto(saved);
    }

    public EventDeleteResDto deleteEvent(
            final Long eventAdminId,
            final Long eventId,
            final Boolean cascade
    ) {
        final Event event = getAuthorizedEvent(eventAdminId, eventId);

        if (event.getStatus() == EventStatus.OPEN) {
            throw new EventException(ErrorCode.CANNOT_DELETE_OPEN_EVENT);
        }

        eventRepository.delete(event);

        final LocalDateTime deletedAt = LocalDateTime.now();

        log.info("[Event] delete completed {id: {}, adminId: {}, cascade: {}}",
                event.getId(),
                event.getEventAdminId(),
                cascade);

        return EventConverter.toEventDeleteResDto(event.getId(), deletedAt);
    }

    private Event getAuthorizedEvent(final Long eventAdminId, final Long eventId) {
        final Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventException(ErrorCode.EVENT_NOT_FOUND));

        validateEventOwnership(eventAdminId, event);
        return event;
    }

    private void validateEventPeriod(final LocalDate startDate, final LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new EventException(ErrorCode.INVALID_EVENT_PERIOD);
        }
    }

    private void validateEventOwnership(final Long eventAdminId, final Event event) {
        if (!event.getEventAdminId().equals(eventAdminId)) {
            throw new EventException(ErrorCode.ACCESS_DENIED);
        }
    }

    private void validateMapImageForOpen(final Long eventId) {
        final EventMap eventMap = eventMapRepository.findFirstByEventIdAndVisibleTrueOrderByIdDesc(eventId)
                .or(() -> eventMapRepository.findFirstByEventIdOrderByIdDesc(eventId))
                .orElseThrow(() -> new EventException(ErrorCode.MAP_IMAGE_REQUIRED_FOR_OPEN));

        if (!StringUtils.hasText(eventMap.getImagePath())) {
            throw new EventException(ErrorCode.MAP_IMAGE_REQUIRED_FOR_OPEN);
        }
    }

    private EventStatus parseEventStatus(final String status) {
        if (status == null) {
            return null;
        }

        try {
            return EventStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new EventException(ErrorCode.INVALID_INPUT);
        }
    }
}
