package com.freeline.domain.auth.service;

import java.security.SecureRandom;
import java.util.Date;
import java.util.List;
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
import com.freeline.domain.auth.dto.request.BoothAdminBulkCreateReqDto;
import com.freeline.domain.auth.dto.request.BoothAdminEmailSendReqDto;
import com.freeline.domain.auth.dto.request.ChangePasswordReqDto;
import com.freeline.domain.auth.dto.request.EmailVerifyReqDto;
import com.freeline.domain.auth.dto.request.LoginReqDto;
import com.freeline.domain.auth.dto.request.SignupReqDto;
import com.freeline.domain.auth.dto.request.UpdateMyInfoReqDto;
import com.freeline.domain.auth.dto.request.VisitorEnterReqDto;
import com.freeline.domain.auth.dto.response.BoothAdminCreateResDto;
import com.freeline.domain.auth.dto.response.BoothAdminResDto;
import com.freeline.domain.auth.dto.response.CheckIdResDto;
import com.freeline.domain.auth.dto.response.LoginResDto;
import com.freeline.domain.auth.dto.response.MyInfoResDto;
import com.freeline.domain.auth.dto.response.SignupResDto;
import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.entity.EventAdmin;
import com.freeline.domain.auth.entity.Role;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.auth.repository.BoothAdminRepository;
import com.freeline.domain.auth.repository.EventAdminRepository;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.Visitor;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.VisitorRepository;

import io.jsonwebtoken.Claims;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String CHAR_UPPER = CHAR_LOWER.toUpperCase();
    private static final String NUMBER = "0123456789";
    private static final String SPECIAL_CHAR = "!@#$%^&*()_+-=";
    private static final String PASSWORD_ALLOW_BASE = CHAR_LOWER + CHAR_UPPER + NUMBER + SPECIAL_CHAR;
    private static final String REDIS_KEY_PREFIX_EMAIL_VERIFIED = "email:verified:";
    private static final String REDIS_KEY_PREFIX_REFRESH = "refresh:";
    private static final SecureRandom random = new SecureRandom();
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
     * 아이디(이메일) 중복 확인
     */
    @Transactional(readOnly = true)
    public CheckIdResDto checkId(final String email) {
        if (email == null || email.isBlank()) {
            return new CheckIdResDto(false);
        }
        boolean exists = eventAdminRepository.existsByEmail(email.trim().toLowerCase());
        return new CheckIdResDto(!exists);
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
        redisTemplate.opsForValue()
                .set(REDIS_KEY_PREFIX_EMAIL_VERIFIED + req.email(), "true", authProperties.getEmailVerifyTtlMinutes(), TimeUnit.MINUTES);
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
        String verified = redisTemplate.opsForValue()
                .get(REDIS_KEY_PREFIX_EMAIL_VERIFIED + req.email());
        if (verified == null || !verified.equals("true")) {
            throw new AuthException(ErrorCode.EMAIL_VERIFICATION_REQUIRED);
        }
        String encodedPassword = passwordEncoder.encode(req.password());
        EventAdmin eventAdmin = authConverter.toEventAdmin(req, encodedPassword);
        EventAdmin saved = eventAdminRepository.save(eventAdmin);
        redisTemplate.delete(REDIS_KEY_PREFIX_EMAIL_VERIFIED + req.email());
        log.info("[Auth] New event admin signed up: {}", saved.getEmail());
        return authConverter.toSignupResDto(saved);
    }

    /**
     * 로그인 (통합)
     */
    @Transactional
    public LoginResDto login(final LoginReqDto req) {
        String identifier = req.id();
        if (identifier.contains("@")) {
            var eventAdminOpt = eventAdminRepository.findByEmail(identifier);
            if (eventAdminOpt.isPresent()) {
                EventAdmin eventAdmin = eventAdminOpt.get();
                validatePassword(req.password(), eventAdmin.getPassword());
                return generateLoginResponse(eventAdmin.getId(), Role.EVENT_ADMIN, eventAdmin.getEmail());
            }
        }
        var boothAdminOpt = boothAdminRepository.findByLoginId(identifier);
        if (boothAdminOpt.isPresent()) {
            BoothAdmin boothAdmin = boothAdminOpt.get();
            validatePassword(req.password(), boothAdmin.getPassword());
            if (!boothAdmin.isActive()) {
                boothAdmin.activateAccount();
            }
            return generateLoginResponse(boothAdmin.getId(), Role.BOOTH_ADMIN, boothAdmin.getLoginId());
        }
        throw new AuthException(ErrorCode.USER_NOT_FOUND);
    }

    /**
     * AccessToken 재발급
     */
    public LoginResDto refresh(final String refreshToken) {
        Claims claims = jwtProvider.getClaims(refreshToken);
        Long userId = Long.parseLong(claims.getSubject());
        String saved = redisTemplate.opsForValue()
                .get(REDIS_KEY_PREFIX_REFRESH + userId);
        if (saved == null || !saved.equals(refreshToken)) {
            throw new AuthException(ErrorCode.INVALID_TOKEN);
        }
        Role role = eventAdminRepository.existsById(userId) ? Role.EVENT_ADMIN : Role.BOOTH_ADMIN;
        String newAccessToken = jwtProvider.createToken(userId, role.name());
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
        eventAdmin.changePassword(passwordEncoder.encode(req.newPassword()));
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
            redisTemplate.opsForValue().set("blacklist:" + token, "logout", remainTime, TimeUnit.MILLISECONDS);
        }
        redisTemplate.delete(REDIS_KEY_PREFIX_REFRESH + userId);
        log.info("[Auth] User logged out, userId: {}", userId);
    }

    /**
     * 행사 주최자 회원 탈퇴
     */
    @Transactional
    public void deleteUser(final Long userId) {
        EventAdmin eventAdmin = eventAdminRepository.findById(userId)
                .orElseThrow(() -> new AuthException(ErrorCode.USER_NOT_FOUND));
        redisTemplate.delete(REDIS_KEY_PREFIX_REFRESH + userId);
        eventAdminRepository.delete(eventAdmin);
        log.info("[Auth] Event admin deleted: {}", eventAdmin.getEmail());
    }

    /**
     * 부스 관리자 일괄 생성
     */
    @Transactional
    public List<BoothAdminCreateResDto> createBoothAdminsBulk(final Long userId, final BoothAdminBulkCreateReqDto req) {
        if (!eventAdminRepository.existsById(userId)) {
            throw new AuthException(ErrorCode.USER_NOT_FOUND);
        }
        return req.admins().stream()
                .map(item -> createSingleBoothAdminAuto(req.eventId(), item))
                .toList();
    }

    /**
     * 부스 관리자 로그인 정보 일괄 발송
     */
    @Transactional
    public void sendBoothAdminLoginsBulk(final Long userId, final BoothAdminEmailSendReqDto req) {
        if (!eventAdminRepository.existsById(userId)) {
            throw new AuthException(ErrorCode.USER_NOT_FOUND);
        }
        List<BoothAdmin> admins = boothAdminRepository.findAllById(req.boothAdminIds());
        if (admins.isEmpty()) {
            throw new AuthException(ErrorCode.USER_NOT_FOUND);
        }
        for (BoothAdmin admin : admins) {
            String rawPassword = createRandomPassword();
            admin.changePassword(passwordEncoder.encode(rawPassword));
            admin.markEmailAsSent();
            sendLoginInfoEmail(admin.getEmail(), admin.getLoginId(), rawPassword);
        }
    }

    /**
     * 행사별 부스 관리자 현황 조회
     */
    @Transactional(readOnly = true)
    public List<BoothAdminResDto> getBoothAdminsByEvent(final Long userId, final Long eventId) {
        if (!eventAdminRepository.existsById(userId)) {
            throw new AuthException(ErrorCode.USER_NOT_FOUND);
        }
        List<Long> boothIds = boothRepository.findAllByEventIdOrderByIdAsc(eventId)
                .stream().map(Booth::getId).toList();
        return boothAdminRepository.findAllByBoothIdInOrderByBoothIdAsc(boothIds)
                .stream().map(admin -> BoothAdminResDto.builder()
                        .id(admin.getId())
                        .boothId(admin.getBoothId())
                        .boothName(admin.getBooth() != null ? admin.getBooth().getName() : null)
                        .loginId(admin.getLoginId())
                        .email(admin.getEmail())
                        .name(admin.getName())
                        .isEmailSent(admin.isEmailSent())
                        .isAccountIssued(admin.isAccountIssued())
                        .isActive(admin.isActive())
                        .isProfileComplete(admin.getName() != null)
                        .build())
                .toList();
    }

    /**
     * 방문자 입장
     */
    @Transactional(readOnly = true)
    public LoginResDto visitorEnter(final VisitorEnterReqDto req) {
        Visitor visitor = visitorRepository.findByEntryCode(req.entryCode())
                .orElseThrow(() -> new AuthException(ErrorCode.VISITOR_NOT_FOUND));
        String token = jwtProvider.createToken(visitor.getId(), Role.VISITOR.name());
        log.info("[Auth] Visitor entered, visitorId: {}", visitor.getId());
        return authConverter.toLoginResDto(token, null, Role.VISITOR);
    }

    private String createVerificationCode() {
        return String.valueOf(random.nextInt(900000) + 100000);
    }

    private String createRandomPassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(PASSWORD_ALLOW_BASE.charAt(random.nextInt(PASSWORD_ALLOW_BASE.length())));
        }
        return sb.toString();
    }

    private void validatePassword(final String rawPassword, final String encodedPassword) {
        if (!passwordEncoder.matches(rawPassword, encodedPassword)) {
            throw new AuthException(ErrorCode.PASSWORD_MISMATCH);
        }
    }

    private LoginResDto generateLoginResponse(final Long id, final Role role, final String identifier) {
        String accessToken = jwtProvider.createToken(id, role.name());
        String refreshToken = jwtProvider.createRefreshToken(id);

        redisTemplate.opsForValue().set(
                REDIS_KEY_PREFIX_REFRESH + id,
                refreshToken,
                refreshTokenExpiration,
                TimeUnit.MILLISECONDS
        );

        log.info("[Auth] {} logged in: {}", role.name(), identifier);
        return authConverter.toLoginResDto(accessToken, refreshToken, role);
    }

    private BoothAdminCreateResDto createSingleBoothAdminAuto(
            final Long eventId,
            final BoothAdminBulkCreateReqDto.BoothAdminItem item
    ) {
        final Long boothId = item.boothId();
        if (!boothRepository.existsById(boothId)) {
            throw new AuthException(ErrorCode.BOOTH_NOT_FOUND);
        }
        if (!boothAdminRepository.findAllByBoothIdIn(List.of(boothId)).isEmpty()) {
            throw new AuthException(ErrorCode.ALREADY_ASSIGNED_BOOTH_ADMIN);
        }
        String loginId = String.format("evt%d_bth%d", eventId, boothId);
        if (boothAdminRepository.findByLoginId(loginId).isPresent()) {
            loginId = String.format("evt%d_bth%d_%d", eventId, boothId, random.nextInt(1000));
        }
        String rawPassword = createRandomPassword();
        BoothAdmin boothAdmin = BoothAdmin.builder()
                .boothId(boothId).loginId(loginId).password(passwordEncoder.encode(rawPassword))
                .email(item.email()).accountIssued(true).build();
        BoothAdmin saved = boothAdminRepository.save(boothAdmin);
        log.info("[Auth] Auto created booth admin, loginId: {}", loginId);
        return BoothAdminCreateResDto.builder()
                .id(saved.getId()).boothId(saved.getBoothId()).loginId(saved.getLoginId())
                .rawPassword(rawPassword).email(saved.getEmail()).build();
    }

    private void sendLoginInfoEmail(final String email, final String loginId, final String password) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[Freeline] 부스 관리자 계정 정보 안내");
            message.setText(String.format(
                    """
                            안녕하세요, Freeline 부스 관리자 계정이 생성되었습니다.

                            로그인 ID: %s
                            초기 비밀번호: %s

                            최초 로그인 시 비밀번호를 반드시 변경해 주시기 바랍니다.""",
                    loginId, password
            ));
            mailSender.send(message);
            log.info("[Auth] Login info sent to: {}", email);
        } catch (Exception e) {
            log.error("[Auth] Failed to send login info to: {}", email, e);
        }
    }
}
