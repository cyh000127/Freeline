package com.freeline.domain.eventadmin.converter;

import lombok.experimental.UtilityClass;

import com.freeline.domain.eventadmin.dto.request.EventAdminCreateReqDto;
import com.freeline.domain.eventadmin.dto.response.EventAdminResDto;
import com.freeline.domain.eventadmin.entity.EventAdmin;
@UtilityClass
public class EventAdminConverter {

	public EventAdmin toEntity(final EventAdminCreateReqDto dto, final String encodedPassword) {
		return EventAdmin.builder()
			.email(dto.email())
			.password(encodedPassword)
			.name(dto.name())
			.build();
	}

	public EventAdminResDto toEventAdminResDto(final EventAdmin eventAdmin) {
		return EventAdminResDto.builder()
			.adminId(eventAdmin.getId())
			.email(eventAdmin.getEmail())
			.name(eventAdmin.getName())
			.createdAt(eventAdmin.getCreatedAt())
			.build();
	}
}

