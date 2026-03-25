package com.freeline.domain.auth.service;

import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.auth.repository.BoothAdminRepository;

@ExtendWith(MockitoExtension.class)
class BoothAdminContextServiceTest {

    @Mock
    private BoothAdminRepository boothAdminRepository;

    @Test
    void boothAdminId로_실제_boothId를_조회한다() {
        final BoothAdminContextService boothAdminContextService = new BoothAdminContextService(boothAdminRepository);
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(11L)
                .loginId("booth-admin-1")
                .boothId(7L)
                .active(true)
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findById(11L)).thenReturn(Optional.of(boothAdmin));

        final Long boothId = boothAdminContextService.resolveBoothId(11L);

        Assertions.assertThat(boothId).isEqualTo(7L);
    }

    @Test
    void 존재하지_않는_boothAdmin이면_예외를_던진다() {
        final BoothAdminContextService boothAdminContextService = new BoothAdminContextService(boothAdminRepository);

        org.mockito.Mockito.when(boothAdminRepository.findById(11L)).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> boothAdminContextService.resolveBoothId(11L))
                .isInstanceOf(AuthException.class);
    }
}
