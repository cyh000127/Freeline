package com.freeline.common.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.freeline.common.constant.BackDomain;
import com.freeline.common.constant.FrontDomain;

@Configuration
public class CorsConfig {
    private static final List<String> ALLOWED_ORIGINS = List.of(
            BackDomain.LOCAL.getUrl(),
            BackDomain.LIVE.getUrl(),
            FrontDomain.LOCAL1.getUrl(),
            FrontDomain.LOCAL2.getUrl(),
            FrontDomain.LIVE.getUrl()
    );

    private static final List<String> ALLOWED_HEADERS = List.of(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "X-Requested-With",
            "accessToken",
            "refreshToken",
            "EnvType"
    );

    private static final List<String> ALLOWED_METHODS = List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
    );

    private static final List<String> EXPOSED_HEADERS = List.of(
            "accessToken",
            "Authorization",
            "refreshToken",
            "Set-Cookie",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
    );

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        final CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(ALLOWED_ORIGINS);
        config.setAllowedHeaders(ALLOWED_HEADERS);
        config.setAllowedMethods(ALLOWED_METHODS);
        config.setExposedHeaders(EXPOSED_HEADERS);
        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
