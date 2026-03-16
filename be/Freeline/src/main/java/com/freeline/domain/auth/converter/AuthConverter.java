package com.freeline.domain.auth.converter;

import org.springframework.stereotype.Component;

import com.freeline.domain.auth.dto.SignupReqDto;
import com.freeline.domain.auth.entity.Organizer;

@Component
public class AuthConverter {

    public Organizer toOrganizer(SignupReqDto req, String encodedPassword) {
        return Organizer.builder()
                .email(req.email())
                .password(encodedPassword)
                .name(req.name())
                .organization(req.organization())
                .verified(true)
                .build();
    }
}
