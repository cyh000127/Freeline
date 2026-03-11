package com.freeline.domain.event.converter;

import com.freeline.domain.event.dto.request.EventCreateReqDto;
import com.freeline.domain.event.dto.response.EventListResDto;
import com.freeline.domain.event.dto.response.EventResDto;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventStatus;

import lombok.experimental.UtilityClass;

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
}
