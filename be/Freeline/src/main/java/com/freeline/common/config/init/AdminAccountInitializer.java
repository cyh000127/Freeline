package com.freeline.common.config.init;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.domain.auth.entity.EventAdmin;
import com.freeline.domain.auth.repository.EventAdminRepository;

@Slf4j
@Component
@Transactional
@RequiredArgsConstructor
public class AdminAccountInitializer implements ApplicationRunner {

    private static final String DEFAULT_PASSWORD = "1234";
    private static final String EVENT_ADMIN_EMAIL = "admin@test.com";
    private static final String EVENT_ADMIN_NAME = "총괄테스터";

    private final EventAdminRepository eventAdminRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(final ApplicationArguments args) {
        if (eventAdminRepository.existsByEmail(EVENT_ADMIN_EMAIL)) {
            log.info("[AdminAccountInitializer] EventAdmin already exists. email={}", EVENT_ADMIN_EMAIL);
            return;
        }

        final EventAdmin eventAdmin = EventAdmin.builder()
                .email(EVENT_ADMIN_EMAIL)
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .name(EVENT_ADMIN_NAME)
                .verified(true)
                .build();

        eventAdminRepository.save(eventAdmin);
        log.info("[AdminAccountInitializer] EventAdmin initialized. email={}", EVENT_ADMIN_EMAIL);
    }
}
