package com.freeline.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;

import com.freeline.common.security.JwtAuthenticationFilter;
import com.freeline.common.security.JwtProvider;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redisTemplate;

    @Bean
    public SecurityFilterChain filterChain(final HttpSecurity http) {
        try {
            http
                    .cors(Customizer.withDefaults())
                    .csrf(AbstractHttpConfigurer::disable)
                    .httpBasic(AbstractHttpConfigurer::disable)
                    .formLogin(AbstractHttpConfigurer::disable)
                    .logout(AbstractHttpConfigurer::disable)
                    .sessionManagement(session ->
                            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers(
                                    "/api/v1/auth/login",
                                    "/api/v1/auth/signup",
                                    "/api/v1/auth/email/**",
                                    "/api/v1/auth/refresh",
                                    "/api/v1/auth/booth-login",
                                    "/api/v1/auth/visitor-login"
                            ).permitAll()
                            .requestMatchers(
                                    "/swagger-ui/**",
                                    "/swagger-ui.html",
                                    "/v3/api-docs/**",
                                    "/actuator/**"
                            ).permitAll()
                            .anyRequest().authenticated()
                    )
                    .addFilterBefore(
                            new JwtAuthenticationFilter(jwtProvider, redisTemplate),
                            UsernamePasswordAuthenticationFilter.class
                    );

            return http.build();
        } catch (final Exception exception) {
            throw new IllegalStateException("Failed to configure security filter chain.", exception);
        }
    }
}
