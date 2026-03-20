package com.freeline.common.config.init;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.domain.auth.entity.EventAdmin;
import com.freeline.domain.auth.repository.EventAdminRepository;

@Slf4j
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestAccountController {

    private static final String DEFAULT_PASSWORD = "1234";
    private static final String EVENT_ADMIN_EMAIL = "admin@test.com";
    private static final String EVENT_ADMIN_NAME = "총괄테스터";

    private final EventAdminRepository eventAdminRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/seed-admin")
    public String seedAdmin() {
        final boolean created = createEventAdminIfAbsent();

        return created
                ? "테스트용 EventAdmin 계정을 생성했습니다."
                : "테스트용 EventAdmin 계정이 이미 존재합니다.";
    }

    private boolean createEventAdminIfAbsent() {
        if (eventAdminRepository.existsByEmail(EVENT_ADMIN_EMAIL)) {
            return false;
        }

        final EventAdmin eventAdmin = EventAdmin.builder()
                .email(EVENT_ADMIN_EMAIL)
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .name(EVENT_ADMIN_NAME)
                .verified(true)
                .build();

        eventAdminRepository.save(eventAdmin);
        log.info("[TestAccount] EventAdmin seeded. email={}", EVENT_ADMIN_EMAIL);
        return true;
    }
}
