package com.freeline.domain.auth.converter;

import org.springframework.stereotype.Component;

import com.freeline.domain.auth.dto.request.SignupReqDto;
import com.freeline.domain.auth.dto.response.BoothAdminListResDto;
import com.freeline.domain.auth.dto.response.LoginResDto;
import com.freeline.domain.auth.dto.response.MyInfoResDto;
import com.freeline.domain.auth.dto.response.SignupResDto;
import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.entity.EventAdmin;
import com.freeline.domain.auth.entity.Role;

@Component
public class AuthConverter {

    public SignupResDto toSignupResDto(final EventAdmin eventAdmin) {
        return SignupResDto.builder()
                .id(eventAdmin.getId())
                .email(eventAdmin.getEmail())
                .name(eventAdmin.getName())
                .company(eventAdmin.getCompany())
                .build();
    }

    public LoginResDto toLoginResDto(final String accessToken, final String refreshToken, final Role role) {
        return LoginResDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(role)
                .build();
    }

    public BoothAdminListResDto toBoothAdminListResDto(final BoothAdmin boothAdmin) {
        return BoothAdminListResDto.builder()
                .adminId(boothAdmin.getId())
                .boothId(boothAdmin.getBoothId())
                .boothName(boothAdmin.getBooth().getName())
                .loginId(boothAdmin.getLoginId())
                .name(boothAdmin.getName())
                .email(boothAdmin.getEmail())
                .company(boothAdmin.getCompany())
                .status(boothAdmin.getStatus().name())
                .lastLoginAt(boothAdmin.getLastLoginAt())
                .build();
    }

    public MyInfoResDto toMyInfoResDto(final EventAdmin eventAdmin) {
        return MyInfoResDto.builder()
                .id(eventAdmin.getId())
                .email(eventAdmin.getEmail())
                .name(eventAdmin.getName())
                .company(eventAdmin.getCompany())
                .build();
    }

    public EventAdmin toEventAdmin(final SignupReqDto req, final String encodedPassword) {
        return EventAdmin.builder()
                .email(req.email())
                .password(encodedPassword)
                .name(req.name())
                .company(req.company())
                .build();
    }
}
