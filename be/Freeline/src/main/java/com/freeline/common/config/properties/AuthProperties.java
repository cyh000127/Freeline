package com.freeline.common.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;

@Getter
@ConfigurationProperties(prefix = "auth")
public class AuthProperties {

    private long emailCodeExpireMinutes;

    public void setEmailCodeExpireMinutes(long emailCodeExpireMinutes) {
        System.out.println("AuthProperties binding value = " + emailCodeExpireMinutes);
        this.emailCodeExpireMinutes = emailCodeExpireMinutes;
    }
}
