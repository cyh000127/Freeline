package com.freeline.domain.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.auth.entity.EmailVerification;

public interface EmailVerificationRepository
        extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findByEmail(String email);

    Optional<EmailVerification> findTopByEmailAndVerifiedTrueOrderByIdDesc(String email);
}
