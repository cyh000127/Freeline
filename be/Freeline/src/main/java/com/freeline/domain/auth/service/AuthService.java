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
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.config.properties.AuthProperties;
import com.freeline.common.error.ErrorCode;
import com.freeline.common.security.JwtProvider;
import com.freeline.domain.auth.converter.AuthConverter;
import com.freeline.domain.auth.dto.request.BoothAdminCreateReqDto;
import com.freeline.domain.auth.dto.request.BoothLoginReqDto;
import com.freeline.domain.auth.dto.request.ChangePasswordReqDto;
import com.freeline.domain.auth.dto.request.EmailVerifyReqDto;
import com.freeline.domain.auth.dto.request.LoginReqDto;
import com.freeline.domain.auth.dto.request.SignupReqDto;
import com.freeline.domain.auth.dto.request.UpdateMyInfoReqDto;
import com.freeline.domain.auth.dto.request.VisitorEnterReqDto;
import com.freeline.domain.auth.dto.response.BoothAdminCreateResDto;
import com.freeline.domain.auth.dto.response.LoginResDto;
import com.freeline.domain.auth.dto.response.MyInfoResDto;
import com.freeline.domain.auth.dto.response.SignupResDto;
import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.entity.EventAdmin;
import com.freeline.domain.auth.entity.Role;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.auth.repository.BoothAdminRepository;
import com.freeline.domain.auth.repository.EventAdminRepository;
import com.freeline.domain.booth.entity.Visitor;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.VisitorRepository;

import io.jsonwebtoken.Claims;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthProperties authProperties;
    private final EventAdminRepository eventAdminRepository;
    private final BoothAdminRepository boothAdminRepository;
    private final VisitorRepository visitorRepository;
    private final BoothRepository boothRepository;
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

        if (eventAdminRepository.existsByEmail(email)) {
            throw new AuthException(ErrorCode.EMAIL_DUPLICATE);
        }

        String code = createVerificationCode();
        String key = "email:verify:" + email;

        // 이미 발송된 인증코드 존재 시 기존 것 삭제 후 재발송 가능하도록 변경 (UX 개선)
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            redisTemplate.delete(key);
        }

        redisTemplate.opsForValue()
                .set(key, code, authProperties.getEmailCodeExpireMinutes(), TimeUnit.MINUTES);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[Freeline] 이메일 인증 코드");
            message.setText("인증 코드: " + code);

            mailSender.send(message);
            log.info("[Auth] Verification code sent to: {}", email);
        } catch (Exception e) {
            log.error("[Auth] Failed to send email to: {}", email, e);
            redisTemplate.delete(key);
            throw new AuthException(ErrorCode.EMAIL_SEND_FAILED);
        }
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
        log.info("[Auth] Email verified: {}", req.email());
    }


    /**
     * 행사 주최자 회원가입
     */
    @Transactional
    public SignupResDto signup(final SignupReqDto req) {
        if (eventAdminRepository.existsByEmail(req.email())) {
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
        EventAdmin eventAdmin = authConverter.toEventAdmin(req, encodedPassword);
        EventAdmin saved = eventAdminRepository.save(eventAdmin);

        // 4. 인증 상태 삭제
        redisTemplate.delete("email:verified:" + req.email());

        log.info("[Auth] New event admin signed up: {}", saved.getEmail());

        // 5. 응답
        return authConverter.toSignupResDto(saved);
    }


    /**
     * 행사 주최자 로그인
     */
    @Transactional(readOnly = true)
    public LoginResDto eventAdminLogin(final LoginReqDto req) {

        EventAdmin eventAdmin = eventAdminRepository
                .findByEmail(req.email())
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(req.password(), eventAdmin.getPassword())) {
            throw new AuthException(ErrorCode.PASSWORD_MISMATCH);
        }

        String accessToken = jwtProvider.createToken(
                eventAdmin.getId(),
                Role.EVENT_ADMIN.name()
        );

        String refreshToken = jwtProvider.createRefreshToken(eventAdmin.getId());

        redisTemplate.opsForValue().set(
                "refresh:" + eventAdmin.getId(),
                refreshToken,
                refreshTokenExpiration,
                TimeUnit.MILLISECONDS
        );

        log.info("[Auth] Event admin logged in: {}", eventAdmin.getEmail());
        return authConverter.toLoginResDto(accessToken, refreshToken, Role.EVENT_ADMIN);
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

        // 토큰에서 Role을 추출하거나 DB에서 조회하여 반영 (보안 강화)
        Role role = eventAdminRepository.existsById(userId) ? Role.EVENT_ADMIN : Role.BOOTH_ADMIN;

        String newAccessToken = jwtProvider.createToken(
                userId,
                role.name()
        );

        return authConverter.toLoginResDto(newAccessToken, refreshToken, role);
    }


    /**
     * 행사 주최자 내 정보 조회
     */
    @Transactional(readOnly = true)
    public MyInfoResDto getMyInfo(final Long userId) {

        EventAdmin eventAdmin = eventAdminRepository.findById(userId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        return authConverter.toMyInfoResDto(eventAdmin);
    }


    /**
     * 행사 주최자 회원정보 수정
     */
    @Transactional
    public MyInfoResDto updateMyInfo(final Long userId, final UpdateMyInfoReqDto req) {

        EventAdmin eventAdmin = eventAdminRepository.findById(userId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        eventAdmin.updateInfo(req.name(), req.organization());
        eventAdminRepository.save(eventAdmin);

        return authConverter.toMyInfoResDto(eventAdmin);
    }


    /**
     * 행사 주최자 비밀번호 변경
     */
    @Transactional
    public void changePassword(final Long userId, final ChangePasswordReqDto req) {

        EventAdmin eventAdmin = eventAdminRepository.findById(userId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(req.currentPassword(), eventAdmin.getPassword())) {
            throw new AuthException(ErrorCode.PASSWORD_MISMATCH);
        }

        eventAdmin.changePassword(
                passwordEncoder.encode(req.newPassword())
        );

        log.info("[Auth] Password changed for event admin: {}", eventAdmin.getEmail());
    }


    /**
     * 행사 주최자 로그아웃
     */
    public void logout(final String token) {

        Claims claims = jwtProvider.getClaims(token);
        Long userId = Long.parseLong(claims.getSubject());
        Date expiration = claims.getExpiration();

        long remainTime = expiration.getTime() - System.currentTimeMillis();

        if (remainTime > 0) {
            redisTemplate.opsForValue().set(
                    "blacklist:" + token,
                    "logout",
                    remainTime,
                    TimeUnit.MILLISECONDS
            );
        }
        redisTemplate.delete("refresh:" + userId);
        log.info("[Auth] User logged out, userId: {}", userId);
    }


    /**
     * 행사 주최자 회원 탈퇴
     */
    @Transactional
    public void deleteUser(final Long userId) {

        EventAdmin eventAdmin = eventAdminRepository.findById(userId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));
        redisTemplate.delete("refresh:" + userId);
        eventAdminRepository.delete(eventAdmin);
        log.info("[Auth] Event admin deleted: {}", eventAdmin.getEmail());
    }


    /**
     * 부스 관리자 생성
     */
    @Transactional
    public BoothAdminCreateResDto createBoothAdmin(final Long userId, final BoothAdminCreateReqDto req) {

        // 1. 요청자가 실제 존재하는 행사 주최자인지 확인
        if (!eventAdminRepository.existsById(userId)) {
            throw new AuthException(ErrorCode.USER_NOT_FOUND);
        }

        // 2. 대상 부스가 실제 존재하는지 확인
        if (!boothRepository.existsById(req.boothId())) {
            throw new AuthException(ErrorCode.BOOTH_NOT_FOUND);
        }

        // 3. 로그인 ID 중복 확인
        if (boothAdminRepository.findByLoginId(req.loginId()).isPresent()) {
            throw new AuthException(ErrorCode.LOGIN_ID_DUPLICATE);
        }

        // 4. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(req.password());

        // 5. 부스 관리자 엔티티 생성
        BoothAdmin boothAdmin = BoothAdmin.builder()
                .boothId(req.boothId())
                .loginId(req.loginId())
                .password(encodedPassword)
                .name(req.name())
                .build();

        BoothAdmin saved = boothAdminRepository.save(boothAdmin);

        log.info("[Auth] New booth admin created by admin {}: {}, boothId: {}", userId, saved.getLoginId(), saved.getBoothId());

        return authConverter.toBoothAdminCreateResDto(saved);
    }


    /**
     * 부스 관리자 로그인
     */
    @Transactional(readOnly = true)
    public LoginResDto boothLogin(final BoothLoginReqDto req) {

        BoothAdmin boothAdmin = boothAdminRepository
                .findByLoginId(req.loginId())
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(req.password(), boothAdmin.getPassword())) {
            throw new AuthException(ErrorCode.PASSWORD_MISMATCH);
        }

        String token = jwtProvider.createToken(
                boothAdmin.getId(),
                Role.BOOTH_ADMIN.name()
        );

        log.info("[Auth] Booth admin logged in: {}", boothAdmin.getLoginId());
        return authConverter.toLoginResDto(token, null, Role.BOOTH_ADMIN);
    }


    /**
     * 방문자 입장
     */
    @Transactional(readOnly = true)
    public LoginResDto visitorEnter(final VisitorEnterReqDto req) {

        Visitor visitor = visitorRepository
                .findByEntryCode(req.entryCode())
                .orElseThrow(() -> new AuthException(ErrorCode.VISITOR_NOT_FOUND));

        String token = jwtProvider.createToken(
                visitor.getId(),
                Role.VISITOR.name()
        );

        log.info("[Auth] Visitor entered, visitorId: {}", visitor.getId());
        return authConverter.toLoginResDto(token, null, Role.VISITOR);
    }
}
