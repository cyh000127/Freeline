package com.freeline.common.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;

@Getter
@ConfigurationProperties(prefix = "auth")
public class AuthProperties {

    private long emailCodeExpireMinutes;
    private long emailVerifyTtlMinutes;

    public void setEmailCodeExpireMinutes(long emailCodeExpireMinutes) {
        this.emailCodeExpireMinutes = emailCodeExpireMinutes;
    }

    public void setEmailVerifyTtlMinutes(long emailVerifyTtlMinutes) {
        this.emailVerifyTtlMinutes = emailVerifyTtlMinutes;
    }
}
