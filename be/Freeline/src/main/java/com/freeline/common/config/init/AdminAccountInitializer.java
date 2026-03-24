package com.freeline.common.config.init;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.domain.auth.entity.EventAdmin;
import com.freeline.domain.auth.repository.EventAdminRepository;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements ApplicationRunner {

    private static final String DEFAULT_PASSWORD = "1234";
    private static final String EVENT_ADMIN_EMAIL = "admin@test.com";
    private static final String EVENT_ADMIN_NAME = "총괄테스터";
    private static final String EVENT_ADMIN_ORGANIZATION = "Freeline";

    private final EventAdminRepository eventAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;

    @Override
    public void run(final ApplicationArguments args) {
        log.info("[AdminAccountInitializer] Startup seed check started. email={}", EVENT_ADMIN_EMAIL);

        try {
            transactionTemplate.executeWithoutResult(status -> initializeAdminAccount());
        } catch (Exception e) {
            log.error(
                    "[AdminAccountInitializer] Failed to initialize admin account. email={}, message={}",
                    EVENT_ADMIN_EMAIL,
                    e.getMessage(),
                    e
            );
            throw e;
        }
    }

    private void initializeAdminAccount() {
        if (eventAdminRepository.existsByEmail(EVENT_ADMIN_EMAIL)) {
            log.info("[AdminAccountInitializer] EventAdmin already exists. email={}", EVENT_ADMIN_EMAIL);
            return;
        }

        final EventAdmin eventAdmin = EventAdmin.builder()
                .email(EVENT_ADMIN_EMAIL)
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .name(EVENT_ADMIN_NAME)
                .organization(EVENT_ADMIN_ORGANIZATION)
                .build();

        log.info(
                "[AdminAccountInitializer] Creating default EventAdmin. email={}, name={}, organization={}",
                EVENT_ADMIN_EMAIL,
                EVENT_ADMIN_NAME,
                EVENT_ADMIN_ORGANIZATION
        );

        final EventAdmin saved = eventAdminRepository.saveAndFlush(eventAdmin);

        if (saved.getId() == null || !eventAdminRepository.existsByEmail(EVENT_ADMIN_EMAIL)) {
            throw new IllegalStateException("Default EventAdmin was not persisted successfully.");
        }

        log.info(
                "[AdminAccountInitializer] EventAdmin initialized successfully. id={}, email={}",
                saved.getId(),
                saved.getEmail()
        );
    }
}
