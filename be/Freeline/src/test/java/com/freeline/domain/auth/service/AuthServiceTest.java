package com.freeline.domain.auth.service;

import java.util.List;
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
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.freeline.common.config.properties.AuthProperties;
import com.freeline.common.error.ErrorCode;
import com.freeline.common.security.JwtProvider;
import com.freeline.domain.auth.converter.AuthConverter;
import com.freeline.domain.auth.dto.request.BoothAdminEmailSendReqDto;
import com.freeline.domain.auth.dto.request.BoothAdminInitialPasswordChangeReqDto;
import com.freeline.domain.auth.dto.request.LoginReqDto;
import com.freeline.domain.auth.dto.response.BoothAdminMeResDto;
import com.freeline.domain.auth.dto.response.LoginResDto;
import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.entity.BoothAdminStatus;
import com.freeline.domain.auth.entity.Role;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.auth.repository.BoothAdminRepository;
import com.freeline.domain.auth.repository.EventAdminRepository;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.VisitorRepository;
import com.freeline.domain.event.entity.Event;
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
    void 비밀번호_변경을_완료한_부스관리자는_로그인_시_boothId를_응답에_포함한다() {
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(11L)
                .loginId("booth-admin-1")
                .password("encoded-password")
                .passwordChanged(true)
                .status(BoothAdminStatus.COMPLETED)
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
    void 최초_로그인_부스관리자는_비밀번호_변경_필수_응답과_회사명_부스명을_받는다() {
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(12L)
                .loginId("booth-admin-first")
                .password("encoded-password")
                .company("Freeline")
                .boothId(9L)
                .active(true)
                .status(BoothAdminStatus.MAILED)
                .build();
        final Booth booth = Booth.builder()
                .id(9L)
                .eventId(3L)
                .name("Freeline Booth")
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findByLoginId("booth-admin-first"))
                .thenReturn(Optional.of(boothAdmin));
        org.mockito.Mockito.when(boothRepository.findById(9L)).thenReturn(Optional.of(booth));
        org.mockito.Mockito.when(passwordEncoder.matches("1234", "encoded-password")).thenReturn(true);

        final LoginResDto response = authService.login(new LoginReqDto("booth-admin-first", "1234"));

        Assertions.assertThat(response.role()).isEqualTo(Role.BOOTH_ADMIN);
        Assertions.assertThat(response.boothId()).isEqualTo(9L);
        Assertions.assertThat(response.isPasswordChangeRequired()).isTrue();
        Assertions.assertThat(response.company()).isEqualTo("Freeline");
        Assertions.assertThat(response.boothName()).isEqualTo("Freeline Booth");
        Assertions.assertThat(response.accessToken()).isNull();
        Assertions.assertThat(response.refreshToken()).isNull();
        Assertions.assertThat(boothAdmin.getLastLoginAt()).isNull();
        org.mockito.Mockito.verify(jwtProvider, org.mockito.Mockito.never())
                .createToken(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void 리프레시가_boothAdmin이면_boothId를_응답에_포함한다() {
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
    void 최초_비밀번호_변경_API는_상태를_COMPLETED로_갱신한다() {
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(21L)
                .loginId("booth-admin-init")
                .password("encoded-temp")
                .boothId(5L)
                .active(true)
                .status(BoothAdminStatus.MAILED)
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findByLoginId("booth-admin-init"))
                .thenReturn(Optional.of(boothAdmin));
        org.mockito.Mockito.when(passwordEncoder.matches("temp-password", "encoded-temp")).thenReturn(true);
        org.mockito.Mockito.when(passwordEncoder.encode("new-password")).thenReturn("encoded-new-password");

        authService.changeBoothAdminInitialPassword(BoothAdminInitialPasswordChangeReqDto.builder()
                .loginId("booth-admin-init")
                .oldPassword("temp-password")
                .newPassword("new-password")
                .build());

        Assertions.assertThat(boothAdmin.isPasswordChanged()).isTrue();
        Assertions.assertThat(boothAdmin.getStatus()).isEqualTo(BoothAdminStatus.COMPLETED);
        Assertions.assertThat(boothAdmin.getPassword()).isEqualTo("encoded-new-password");
    }

    @Test
    void 부스관리자_로그인정보_메일_발송이_실패하면_AuthException을_던진다() {
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(31L)
                .loginId("booth-admin-mail")
                .password("encoded-password")
                .email("booth-admin@test.com")
                .boothId(6L)
                .active(true)
                .build();

        org.mockito.Mockito.when(eventAdminRepository.existsById(1L)).thenReturn(true);
        org.mockito.Mockito.when(boothAdminRepository.findAllById(List.of(31L))).thenReturn(List.of(boothAdmin));
        org.mockito.Mockito.when(passwordEncoder.encode(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn("encoded-temp-password");
        org.mockito.Mockito.doThrow(new RuntimeException("mail failed"))
                .when(mailSender)
                .send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));

        Assertions.assertThatThrownBy(() -> authService.sendBoothAdminLoginsBulk(
                        1L,
                        BoothAdminEmailSendReqDto.builder().boothAdminIds(List.of(31L)).build()
                ))
                .isInstanceOf(AuthException.class)
                .satisfies(exception -> Assertions.assertThat(((AuthException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.EMAIL_SEND_FAILED));
    }

    @Test
    void 부스관리자_내정보_조회시_boothId를_반환한다() {
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

    @Test
    void 행사_주최자는_자신의_행사에_속한_부스관리자만_삭제할_수_있다() {
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(41L)
                .loginId("booth-admin-delete")
                .email("booth-admin-delete@test.com")
                .boothId(15L)
                .active(true)
                .build();
        final Booth booth = Booth.builder()
                .id(15L)
                .eventId(21L)
                .name("Delete Booth")
                .build();
        final Event event = Event.builder()
                .id(21L)
                .eventAdminId(2L)
                .name("Freeline Event")
                .description("desc")
                .locationAddress("Seoul")
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findById(41L)).thenReturn(Optional.of(boothAdmin));
        org.mockito.Mockito.when(boothRepository.findById(15L)).thenReturn(Optional.of(booth));
        org.mockito.Mockito.when(eventRepository.findById(21L)).thenReturn(Optional.of(event));

        authService.deleteBoothAdmin(2L, 41L);

        org.mockito.Mockito.verify(redisTemplate).delete("refresh:BOOTH_ADMIN:41");
        org.mockito.Mockito.verify(boothAdminRepository).delete(boothAdmin);
    }

    @Test
    void 행사_주최자는_다른_행사의_부스관리자를_삭제할_수_없다() {
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(51L)
                .loginId("booth-admin-forbidden")
                .email("booth-admin-forbidden@test.com")
                .boothId(25L)
                .active(true)
                .build();
        final Booth booth = Booth.builder()
                .id(25L)
                .eventId(31L)
                .name("Forbidden Booth")
                .build();
        final Event event = Event.builder()
                .id(31L)
                .eventAdminId(99L)
                .name("Other Event")
                .description("desc")
                .locationAddress("Busan")
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findById(51L)).thenReturn(Optional.of(boothAdmin));
        org.mockito.Mockito.when(boothRepository.findById(25L)).thenReturn(Optional.of(booth));
        org.mockito.Mockito.when(eventRepository.findById(31L)).thenReturn(Optional.of(event));

        Assertions.assertThatThrownBy(() -> authService.deleteBoothAdmin(2L, 51L))
                .isInstanceOf(AuthException.class)
                .satisfies(exception -> Assertions.assertThat(((AuthException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.ACCESS_DENIED));

        org.mockito.Mockito.verify(boothAdminRepository, org.mockito.Mockito.never())
                .delete(org.mockito.ArgumentMatchers.any(BoothAdmin.class));
    }
}
