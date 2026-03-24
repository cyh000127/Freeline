package com.freeline.common.security;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
    private static final List<String> EXCLUDED_PATHS = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/signup",
            "/api/v1/auth/email/**",
            "/api/v1/auth/refresh",
            "/api/v1/auth/check-id",
            "/api/v1/auth/visitors/entry-code/authenticate",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/actuator/**"
    );

    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redisTemplate;

    public JwtAuthenticationFilter(JwtProvider jwtProvider, StringRedisTemplate redisTemplate) {
        this.jwtProvider = jwtProvider;
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String path = request.getRequestURI();

        // 제외 경로 체크
        boolean isExcluded = EXCLUDED_PATHS.stream()
                .anyMatch(pattern -> PATH_MATCHER.match(pattern, path));

        if (isExcluded) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = resolveToken(request);

        if (token != null && jwtProvider.validateToken(token)) {
            // 블랙리스트 체크 (로그아웃 토큰)
            if (Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + token))) {
                filterChain.doFilter(request, response);
                return;
            }

            Claims claims = jwtProvider.getClaims(token);
            String userId = claims.getSubject();
            String role = claims.get("role", String.class);

            UserDetails userDetails = User.builder()
                    .username(userId)
                    .password("")
                    .roles(role)
                    .build();

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
            );

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        final String bearer = request.getHeader("Authorization");

        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }

        return null;
    }
}
