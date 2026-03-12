package com.freeline.domain.event.converter;

import lombok.experimental.UtilityClass;

import com.freeline.domain.event.dto.request.EventPolicyReqDto;
import com.freeline.domain.event.dto.response.EventPolicyResDto;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventPolicy;

@UtilityClass
public class EventPolicyConverter {

    public EventPolicy toEntity(final Event event, final EventPolicyReqDto dto) {
        return EventPolicy.builder()
                .event(event)
                .defaultStaySec(dto.defaultStaySec())
                .defaultMaxWaiting(dto.defaultMaxWaiting())
                .defaultCallCount(dto.defaultCallCount())
                .defaultCallTtl(dto.defaultCallTtl())
                .defaultDeferLimit(dto.defaultDeferLimit())
                .build();
    }

    public EventPolicyResDto toEventPolicyResDto(final EventPolicy eventPolicy) {
        return EventPolicyResDto.builder()
                .policyId(eventPolicy.getId())
                .eventId(eventPolicy.getEvent().getId())
                .updatedAt(eventPolicy.getUpdatedAt())
                .build();
    }
}
