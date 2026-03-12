package com.freeline.domain.eventadmin.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.eventadmin.converter.EventAdminConverter;
import com.freeline.domain.eventadmin.dto.request.EventAdminCreateReqDto;
import com.freeline.domain.eventadmin.dto.response.EventAdminResDto;
import com.freeline.domain.eventadmin.entity.EventAdmin;
import com.freeline.domain.eventadmin.exception.EventAdminException;
import com.freeline.domain.eventadmin.repository.EventAdminRepository;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class EventAdminService {

    private final EventAdminRepository eventAdminRepository;
    private final PasswordEncoder passwordEncoder;

    public EventAdminResDto createEventAdmin(final EventAdminCreateReqDto request) {
        if (eventAdminRepository.existsByEmail(request.email())) {
            throw new EventAdminException(ErrorCode.ADMIN_EMAIL_DUPLICATE);
        }

        final String encodedPassword = passwordEncoder.encode(request.password());
        final EventAdmin eventAdmin = EventAdminConverter.toEntity(request, encodedPassword);
        final EventAdmin saved = eventAdminRepository.save(eventAdmin);

        log.info("[EventAdmin] 생성 완료 {id: {}, email: {}}", saved.getId(), saved.getEmail());

        return EventAdminConverter.toEventAdminResDto(saved);
    }
}
