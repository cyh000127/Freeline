package com.freeline.common.security;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redisTemplate;

    public JwtAuthenticationFilter(
            JwtProvider jwtProvider,
            StringRedisTemplate redisTemplate
    ) {
        this.jwtProvider = jwtProvider;
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        System.out.println("JWT FILTER 실행");

        String token = resolveToken(request);

        System.out.println("token = " + token);

        if (token != null && jwtProvider.validateToken(token)) {
            // blacklist 검사 추가
            String isBlacklisted = redisTemplate.opsForValue()
                    .get("blacklist:" + token);

            if (isBlacklisted != null) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "로그인 해주세요.");
                return;
            }

            Claims claims = jwtProvider.getClaims(token);

            Long id = claims.get("id", Long.class);
            String role = claims.get("role", String.class);

            SimpleGrantedAuthority authority =
                    new SimpleGrantedAuthority("ROLE_" + role);

            Authentication authentication =
                    new UsernamePasswordAuthenticationToken(
                            String.valueOf(id),
                            null,
                            List.of(authority)
                    );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            System.out.println("authentication 저장 완료");
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {

        String bearer = request.getHeader("Authorization");

        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }

        return null;
    }
}
