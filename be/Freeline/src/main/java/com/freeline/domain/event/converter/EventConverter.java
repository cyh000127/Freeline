package com.freeline.domain.event.converter;

import java.time.LocalDateTime;
import java.util.List;

import lombok.experimental.UtilityClass;

import com.freeline.domain.event.dto.request.EventCreateReqDto;
import com.freeline.domain.event.dto.response.BoothCongestionDto;
import com.freeline.domain.event.dto.response.DashboardSummaryDto;
import com.freeline.domain.event.dto.response.EventDashboardResDto;
import com.freeline.domain.event.dto.response.EventDeleteResDto;
import com.freeline.domain.event.dto.response.EventDetailResDto;
import com.freeline.domain.event.dto.response.EventListResDto;
import com.freeline.domain.event.dto.response.EventResDto;
import com.freeline.domain.event.dto.response.EventUpdateResDto;
import com.freeline.domain.event.dto.response.TopWaitingBoothDto;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventStatus;

@UtilityClass
public class EventConverter {

    public Event toEntity(
            final Long eventAdminId,
            final EventCreateReqDto dto,
            final EventStatus status
    ) {
        return Event.builder()
                .eventAdminId(eventAdminId)
                .name(dto.name())
                .description(dto.description())
                .startDate(dto.startDate())
                .endDate(dto.endDate())
                .openTime(dto.openTime())
                .closeTime(dto.closeTime())
                .locationAddress(dto.locationAddress())
                .thumbnailImageUrl(dto.thumbnailImageUrl())
                .status(status)
                .build();
    }

    public EventResDto toEventResDto(final Event event) {
        return EventResDto.builder()
                .eventId(event.getId())
                .status(event.getStatus().name())
                .createdAt(event.getCreatedAt())
                .build();
    }

    public EventUpdateResDto toEventUpdateResDto(final Event event) {
        return EventUpdateResDto.builder()
                .eventId(event.getId())
                .status(event.getStatus().name())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    public EventUpdateResDto toEventUpdateResDto(
            final Long eventId,
            final EventStatus status,
            final LocalDateTime updatedAt
    ) {
        return EventUpdateResDto.builder()
                .eventId(eventId)
                .status(status.name())
                .updatedAt(updatedAt)
                .build();
    }

    public EventDeleteResDto toEventDeleteResDto(final Long eventId, final LocalDateTime deletedAt) {
        return EventDeleteResDto.builder()
                .eventId(eventId)
                .deletedAt(deletedAt)
                .build();
    }

    public EventListResDto toEventListResDto(final Event event) {
        return EventListResDto.builder()
                .eventId(event.getId())
                .name(event.getName())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .status(event.getStatus().name())
                .thumbnailImageUrl(event.getThumbnailImageUrl())
                .createdAt(event.getCreatedAt())
                .build();
    }

    public EventDetailResDto toEventDetailResDto(
            final Event event,
            final String mapImageUrl,
            final List<EventDetailResDto.BoothSummaryDto> booths
    ) {
        return EventDetailResDto.builder()
                .eventId(event.getId())
                .eventAdminId(event.getEventAdminId())
                .name(event.getName())
                .description(event.getDescription())
                .authCode(null)
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .openTime(event.getOpenTime())
                .closeTime(event.getCloseTime())
                .locationAddress(event.getLocationAddress())
                .thumbnailImageUrl(event.getThumbnailImageUrl())
                .mapImageUrl(mapImageUrl)
                .status(event.getStatus().name())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .booths(booths)
                .build();
    }

    public EventDashboardResDto toEventDashboardResDto(
            final Event event,
            final DashboardSummaryDto summary,
            final BoothCongestionDto boothCongestion,
            final List<TopWaitingBoothDto> topWaitingBooths,
            final LocalDateTime lastUpdated
    ) {
        return EventDashboardResDto.builder()
                .eventId(event.getId())
                .eventStatus(event.getStatus().name())
                .summary(summary)
                .boothCongestion(boothCongestion)
                .topWaitingBooths(topWaitingBooths)
                .lastUpdated(lastUpdated)
                .build();
    }
}
