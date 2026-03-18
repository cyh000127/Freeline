package com.freeline.domain.auth.service;

import java.security.SecureRandom;
import java.util.Date;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.freeline.common.config.properties.AuthProperties;
import com.freeline.common.error.ErrorCode;
import com.freeline.common.security.JwtProvider;
import com.freeline.domain.auth.converter.AuthConverter;
import com.freeline.domain.auth.dto.BoothLoginReqDto;
import com.freeline.domain.auth.dto.ChangePasswordReqDto;
import com.freeline.domain.auth.dto.EmailVerifyReqDto;
import com.freeline.domain.auth.dto.LoginReqDto;
import com.freeline.domain.auth.dto.LoginResDto;
import com.freeline.domain.auth.dto.MyInfoResDto;
import com.freeline.domain.auth.dto.PinEnterReqDto;
import com.freeline.domain.auth.dto.SignupReqDto;
import com.freeline.domain.auth.dto.SignupResDto;
import com.freeline.domain.auth.dto.UpdateMyInfoReqDto;
import com.freeline.domain.auth.entity.BoothManager;
import com.freeline.domain.auth.entity.Organizer;
import com.freeline.domain.auth.entity.PinUser;
import com.freeline.domain.auth.entity.Role;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.auth.repository.BoothManagerRepository;
import com.freeline.domain.auth.repository.OrganizerRepository;
import com.freeline.domain.auth.repository.PinUserRepository;

import io.jsonwebtoken.Claims;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthProperties authProperties;
    private final OrganizerRepository organizerRepository;
    private final BoothManagerRepository boothManagerRepository;
    private final PinUserRepository pinUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redisTemplate;
    private final AuthConverter authConverter;
    private final JavaMailSender mailSender;
    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    /**
     * 이메일 인증 코드 생성
     */
    private String createVerificationCode() {
        SecureRandom random = new SecureRandom();
        int code = random.nextInt(900000) + 100000;
        return String.valueOf(code);
    }


    /**
     * 이메일 인증 코드 발송
     */
    public void sendVerificationCode(final String email) {


        if (organizerRepository.existsByEmail(email)) {
            throw new AuthException(ErrorCode.EMAIL_DUPLICATE);
        }

        String code = createVerificationCode();

        String key = "email:verify:" + email;
        // 이미 발송된 인증코드 존재 확인
        if (redisTemplate.hasKey(key)) {
            throw new AuthException(ErrorCode.EMAIL_ALREADY_SENT);
        }

        redisTemplate.opsForValue()
                .set(key, code, authProperties.getEmailCodeExpireMinutes(), TimeUnit.MINUTES);

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("[Freeline] 이메일 인증 코드");
        message.setText("인증 코드: " + code);

        mailSender.send(message);
    }

    /**
     * 이메일 인증 확인
     */
    public void verifyCode(final EmailVerifyReqDto req) {

        String key = "email:verify:" + req.email();

        String savedCode = redisTemplate.opsForValue().get(key);

        if (savedCode == null) {
            throw new AuthException(ErrorCode.EMAIL_CODE_EXPIRED);
        }

        if (!savedCode.equals(req.code())) {
            throw new AuthException(ErrorCode.EMAIL_CODE_MISMATCH);
        }

        redisTemplate.delete(key);

        // 인증 완료 상태 저장
        redisTemplate.opsForValue()
                .set("email:verified:" + req.email(), "true", authProperties.getEmailVerifyTtlMinutes(), TimeUnit.MINUTES);
    }

    /**
     * 행사주최자 회원가입
     */
    public SignupResDto signup(final SignupReqDto req) {
        if (organizerRepository.existsByEmail(req.email())) {
            throw new AuthException(ErrorCode.EMAIL_DUPLICATE);
        }

        // 1. 이메일 인증 여부 확인
        String verified = redisTemplate.opsForValue()
                .get("email:verified:" + req.email());

        if (verified == null || !verified.equals("true")) {
            throw new AuthException(ErrorCode.EMAIL_VERIFICATION_REQUIRED);
        }

        // 2. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(req.password());

        // 3. 회원 생성
        Organizer organizer = authConverter.toOrganizer(req, encodedPassword);

        Organizer saved = organizerRepository.save(organizer);

        // 4. 인증 상태 삭제
        redisTemplate.delete("email:verified:" + req.email());

        // 5. 응답
        return SignupResDto.builder()
                .id(saved.getId())
                .email(saved.getEmail())
                .name(saved.getName())
                .build();
    }

    /**
     * 행사주최자 로그인
     */
    @Transactional(readOnly = true)
    public LoginResDto organizerLogin(final LoginReqDto req) {

        Organizer organizer = organizerRepository
                .findByEmail(req.email())
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(req.password(), organizer.getPassword())) {
            throw new AuthException(ErrorCode.PASSWORD_MISMATCH);
        }

        String accessToken = jwtProvider.createToken(
                organizer.getId(),
                Role.EVENT_ORGANIZER.name()
        );

        String refreshToken = jwtProvider.createRefreshToken(organizer.getId());

        redisTemplate.delete("refresh:" + organizer.getId());
        redisTemplate.opsForValue().set(
                "refresh:" + organizer.getId(),
                refreshToken,
                refreshTokenExpiration,
                TimeUnit.MILLISECONDS
        );
        return LoginResDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * AccessToken 재발급
     */
    public LoginResDto refresh(final String refreshToken) {

        // refresh token 검증
        Claims claims = jwtProvider.getClaims(refreshToken);

        Long userId = Long.parseLong(claims.getSubject());

        // Redis에 저장된 refresh token 조회
        String saved = redisTemplate.opsForValue()
                .get("refresh:" + userId);

        if (saved == null || !saved.equals(refreshToken)) {
            throw new AuthException(ErrorCode.INVALID_TOKEN);
        }

        // 새로운 access token 발급
        String newAccessToken = jwtProvider.createToken(
                userId,
                Role.EVENT_ORGANIZER.name()
        );

        return LoginResDto.builder()
                .accessToken(newAccessToken)
                .build();
    }


    /**
     * 행사주최자 내정보 조회
     */
    @Transactional(readOnly = true)
    public MyInfoResDto getMyInfo(final Long userId) {

        Organizer organizer = organizerRepository.findById(userId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        return MyInfoResDto.builder()
                .id(organizer.getId())
                .email(organizer.getEmail())
                .name(organizer.getName())
                .organization(organizer.getOrganization())
                .build();
    }

    /**
     * 행사주최자 회원정보 수정
     */
    public MyInfoResDto updateMyInfo(final Long userId, final UpdateMyInfoReqDto req) {

        Organizer organizer = organizerRepository.findById(userId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        organizer.updateInfo(req.name(), req.organization());

        organizerRepository.save(organizer);

        return MyInfoResDto.builder()
                .id(organizer.getId())
                .email(organizer.getEmail())
                .name(organizer.getName())
                .organization(organizer.getOrganization())
                .build();
    }

    /**
     * 행사주최자 비밀번호 변경
     */
    @Transactional
    public void changePassword(final Long userId, final ChangePasswordReqDto req) {

        Organizer organizer = organizerRepository.findById(userId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(req.currentPassword(), organizer.getPassword())) {
            throw new AuthException(ErrorCode.PASSWORD_MISMATCH);
        }

        organizer.changePassword(
                passwordEncoder.encode(req.newPassword())
        );

    }


    /**
     * 행사주최자 로그아웃
     */
    public void logout(final String token) {

        Claims claims = jwtProvider.getClaims(token);
        Long userId = Long.parseLong(claims.getSubject());
        Date expiration = claims.getExpiration();

        long remainTime = expiration.getTime() - System.currentTimeMillis();

        redisTemplate.opsForValue().set(
                "blacklist:" + token,
                "logout",
                remainTime,
                TimeUnit.MILLISECONDS
        );
        redisTemplate.delete("refresh:" + userId);
    }

    /**
     * 행사주최자 회원탈퇴
     */
    public void deleteUser(final Long userId) {

        Organizer organizer = organizerRepository.findById(userId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));
        redisTemplate.delete("refresh:" + userId);
        organizerRepository.delete(organizer);
    }

    /**
     * 부스관리자 로그인
     */
    @Transactional(readOnly = true)
    public LoginResDto boothLogin(final BoothLoginReqDto req) {

        BoothManager manager = boothManagerRepository
                .findByLoginId(req.loginId())
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(req.password(), manager.getPassword())) {
            throw new AuthException(ErrorCode.PASSWORD_MISMATCH);
        }

        String token = jwtProvider.createToken(
                manager.getId(),
                Role.BOOTH_MANAGER.name()
        );

        return LoginResDto.builder()
                .accessToken(token)
                .build();
    }

    /**
     * PIN 사용자 입장
     */
    @Transactional(readOnly = true)
    public LoginResDto pinEnter(final PinEnterReqDto req) {

        PinUser pinUser = pinUserRepository
                .findByPinCode(req.pinCode())
                .orElseThrow(() -> new AuthException(ErrorCode.PIN_NOT_FOUND));

        String token = jwtProvider.createToken(
                pinUser.getId(),
                Role.PERSONAL_USER.name()
        );

        return LoginResDto.builder()
                .accessToken(token)
                .build();
    }
}
