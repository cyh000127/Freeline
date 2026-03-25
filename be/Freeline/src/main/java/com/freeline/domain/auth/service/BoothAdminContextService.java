package com.freeline.domain.auth.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.auth.repository.BoothAdminRepository;

@Service
@RequiredArgsConstructor
public class BoothAdminContextService {

    private final BoothAdminRepository boothAdminRepository;

    @Transactional(readOnly = true)
    public Long resolveBoothId(final Long boothAdminId) {
        return getBoothAdmin(boothAdminId).getBoothId();
    }

    @Transactional(readOnly = true)
    public BoothAdmin getBoothAdmin(final Long boothAdminId) {
        return boothAdminRepository.findById(boothAdminId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));
    }
}
