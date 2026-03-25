package com.freeline.domain.auth.service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.freeline.common.config.properties.AuthProperties;
import com.freeline.common.security.JwtProvider;
import com.freeline.domain.auth.converter.AuthConverter;
import com.freeline.domain.auth.dto.request.LoginReqDto;
import com.freeline.domain.auth.dto.response.BoothAdminMeResDto;
import com.freeline.domain.auth.dto.response.LoginResDto;
import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.entity.Role;
import com.freeline.domain.auth.repository.BoothAdminRepository;
import com.freeline.domain.auth.repository.EventAdminRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.VisitorRepository;
import com.freeline.domain.event.repository.EventRepository;

import io.jsonwebtoken.Claims;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthProperties authProperties;

    @Mock
    private EventAdminRepository eventAdminRepository;

    @Mock
    private BoothAdminRepository boothAdminRepository;

    @Mock
    private VisitorRepository visitorRepository;

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private JavaMailSender mailSender;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                authProperties,
                eventAdminRepository,
                boothAdminRepository,
                visitorRepository,
                boothRepository,
                eventRepository,
                passwordEncoder,
                jwtProvider,
                redisTemplate,
                new AuthConverter(),
                mailSender
        );
        ReflectionTestUtils.setField(authService, "refreshTokenExpiration", 120000L);
        org.mockito.Mockito.lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void 부스관리자_로그인시_boothId를_응답에_포함한다() {
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(11L)
                .loginId("booth-admin-1")
                .password("encoded-password")
                .boothId(7L)
                .active(true)
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findByLoginId("booth-admin-1"))
                .thenReturn(Optional.of(boothAdmin));
        org.mockito.Mockito.when(passwordEncoder.matches("1234", "encoded-password")).thenReturn(true);
        org.mockito.Mockito.when(jwtProvider.createToken(11L, Role.BOOTH_ADMIN.name())).thenReturn("access-token");
        org.mockito.Mockito.when(jwtProvider.createRefreshToken(11L, Role.BOOTH_ADMIN.name()))
                .thenReturn("refresh-token");

        final LoginResDto response = authService.login(new LoginReqDto("booth-admin-1", "1234"));

        Assertions.assertThat(response.role()).isEqualTo(Role.BOOTH_ADMIN);
        Assertions.assertThat(response.boothId()).isEqualTo(7L);
        org.mockito.Mockito.verify(valueOperations)
                .set("refresh:BOOTH_ADMIN:11", "refresh-token", 120000L, TimeUnit.MILLISECONDS);
    }

    @Test
    void 리프레시시_boothAdmin이면_boothId를_응답에_포함한다() {
        final Claims claims = org.mockito.Mockito.mock(Claims.class);
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(11L)
                .loginId("booth-admin-1")
                .password("encoded-password")
                .boothId(7L)
                .active(true)
                .build();

        org.mockito.Mockito.when(jwtProvider.getClaims("refresh-token")).thenReturn(claims);
        org.mockito.Mockito.when(claims.getSubject()).thenReturn("11");
        org.mockito.Mockito.when(claims.get("role", String.class)).thenReturn(Role.BOOTH_ADMIN.name());
        org.mockito.Mockito.when(valueOperations.get("refresh:BOOTH_ADMIN:11")).thenReturn("refresh-token");
        org.mockito.Mockito.when(boothAdminRepository.findById(11L)).thenReturn(Optional.of(boothAdmin));
        org.mockito.Mockito.when(jwtProvider.createToken(11L, Role.BOOTH_ADMIN.name())).thenReturn("new-access-token");

        final LoginResDto response = authService.refresh("refresh-token");

        Assertions.assertThat(response.role()).isEqualTo(Role.BOOTH_ADMIN);
        Assertions.assertThat(response.boothId()).isEqualTo(7L);
        Assertions.assertThat(response.accessToken()).isEqualTo("new-access-token");
    }

    @Test
    void 부스관리자_내정보조회시_boothId를_반환한다() {
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(11L)
                .loginId("booth-admin-1")
                .email("booth-admin@test.com")
                .name("부스 관리자")
                .company("Freeline")
                .boothId(7L)
                .active(true)
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findById(11L)).thenReturn(Optional.of(boothAdmin));

        final BoothAdminMeResDto response = authService.getBoothAdminMyInfo(11L);

        Assertions.assertThat(response.id()).isEqualTo(11L);
        Assertions.assertThat(response.boothId()).isEqualTo(7L);
        Assertions.assertThat(response.loginId()).isEqualTo("booth-admin-1");
    }
}
