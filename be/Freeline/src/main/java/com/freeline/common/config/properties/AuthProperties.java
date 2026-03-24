package com.freeline.common.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;

@Getter
@ConfigurationProperties(prefix = "auth")
public class AuthProperties {

    // 이메일 인증 코드 만료 시간 (10분 고정)
    private final long emailCodeExpireMinutes = 10L;

    // 이메일 인증 성공 후 유효 시간 (10분 고정)
    private final long emailVerifyTtlMinutes = 10L;
}
