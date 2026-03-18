package com.freeline.domain.auth.converter;

import org.springframework.stereotype.Component;

import com.freeline.domain.auth.dto.request.BoothAdminCreateReqDto;
import com.freeline.domain.auth.dto.request.SignupReqDto;
import com.freeline.domain.auth.dto.response.BoothAdminCreateResDto;
import com.freeline.domain.auth.dto.response.LoginResDto;
import com.freeline.domain.auth.dto.response.MyInfoResDto;
import com.freeline.domain.auth.dto.response.SignupResDto;
import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.entity.EventAdmin;
import com.freeline.domain.auth.entity.Role;

@Component
public class AuthConverter {

    public EventAdmin toEventAdmin(final SignupReqDto req, final String encodedPassword) {
        return EventAdmin.builder()
                .email(req.email())
                .password(encodedPassword)
                .name(req.name())
                .organization(req.organization())
                .verified(true)
                .build();
    }

    public SignupResDto toSignupResDto(final EventAdmin eventAdmin) {
        return SignupResDto.builder()
                .id(eventAdmin.getId())
                .email(eventAdmin.getEmail())
                .name(eventAdmin.getName())
                .build();
    }

    public LoginResDto toLoginResDto(final String accessToken, final String refreshToken, final Role role) {
        return LoginResDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(role)
                .build();
    }

    public MyInfoResDto toMyInfoResDto(final EventAdmin eventAdmin) {
        return MyInfoResDto.builder()
                .id(eventAdmin.getId())
                .email(eventAdmin.getEmail())
                .name(eventAdmin.getName())
                .organization(eventAdmin.getOrganization())
                .build();
    }

    public BoothAdmin toBoothAdmin(final BoothAdminCreateReqDto req, final String encodedPassword) {
        return BoothAdmin.builder()
                .loginId(req.loginId())
                .password(encodedPassword)
                .name(req.name())
                .boothId(req.boothId())
                .build();
    }

    public BoothAdminCreateResDto toBoothAdminCreateResDto(final BoothAdmin boothAdmin) {
        return BoothAdminCreateResDto.builder()
                .id(boothAdmin.getId())
                .loginId(boothAdmin.getLoginId())
                .name(boothAdmin.getName())
                .build();
    }
}
