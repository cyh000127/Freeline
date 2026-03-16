package com.freeline.domain.auth.service;

import java.security.SecureRandom;
import java.util.Date;
import java.util.concurrent.TimeUnit;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import com.freeline.common.config.properties.AuthProperties;
import com.freeline.common.security.JwtProvider;
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
import com.freeline.domain.auth.repository.BoothManagerRepository;
import com.freeline.domain.auth.repository.OrganizerRepository;
import com.freeline.domain.auth.repository.PinUserRepository;

import io.jsonwebtoken.Claims;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthProperties authProperties;
    private static final long EMAIL_VERIFY_TTL = 10; // 추가

    private final OrganizerRepository organizerRepository;
    private final BoothManagerRepository boothManagerRepository;
    private final PinUserRepository pinUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redisTemplate;

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
    private final JavaMailSender mailSender;

    public void sendVerificationCode(String email) {

        System.out.println("ENV EMAIL_CODE_EXPIRE_MINUTES = "
                + System.getenv("EMAIL_CODE_EXPIRE_MINUTES"));

        System.out.println("PROP emailCodeExpireMinutes = "
                + authProperties.getEmailCodeExpireMinutes());

        if (organizerRepository.existsByEmail(email)) {
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }

        String code = createVerificationCode();

        String key = "email:verify:" + email;
        // 이미 발송된 인증코드 존재 확인
        if (redisTemplate.hasKey(key)) {
            throw new RuntimeException("이미 인증 코드가 발송되었습니다.");
        }

        redisTemplate.opsForValue()
                .set(key, code, authProperties.getEmailCodeExpireMinutes(), TimeUnit.MINUTES);

        SimpleMailMessage message = new SimpleMailMessage();

        System.out.println("REDIS SAVE KEY = " + key);
        System.out.println("REDIS SAVE CODE = " + code);


        message.setTo(email);
        message.setSubject("[Freeline] 이메일 인증 코드");
        message.setText("인증 코드: " + code);

        mailSender.send(message);
    }

    /**
     * 이메일 인증 확인
     */
    public void verifyCode(EmailVerifyReqDto req) {

        String key = "email:verify:" + req.getEmail();

        String savedCode = redisTemplate.opsForValue().get(key);

        if (savedCode == null) {
            throw new RuntimeException("인증 코드가 만료되었습니다.");
        }

        if (!savedCode.equals(req.getCode())) {
            throw new RuntimeException("인증 코드가 일치하지 않습니다.");
        }

        redisTemplate.delete(key);

        // 인증 완료 상태 저장
        redisTemplate.opsForValue()
                .set("email:verified:" + req.getEmail(), "true", EMAIL_VERIFY_TTL, TimeUnit.MINUTES);
    }

    /**
     * 행사주최자 회원가입
     */
    public SignupResDto signup(SignupReqDto req) {
        if (organizerRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }

        // 1. 이메일 인증 여부 확인
        String verified = redisTemplate.opsForValue()
                .get("email:verified:" + req.getEmail());

        if (verified == null || !verified.equals("true")) {
            throw new RuntimeException("이메일 인증이 필요합니다.");
        }


        // 2. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(req.getPassword());

        // 3. 회원 생성
        Organizer organizer = Organizer.builder()
                .email(req.getEmail())
                .password(encodedPassword)
                .name(req.getName())
                .organization(req.getOrganization())
                .verified(true) // 인증된 상태로 저장
                .build();

        organizerRepository.save(organizer);

        // 4. 인증 상태 삭제
        redisTemplate.delete("email:verified:" + req.getEmail());

        // 5. 응답
        return SignupResDto.builder()
                .id(organizer.getId())
                .email(organizer.getEmail())
                .name(organizer.getName())
                .build();
    }

    /**
     * 행사주최자 로그인
     */
    public LoginResDto organizerLogin(LoginReqDto req) {

        Organizer organizer = organizerRepository
                .findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        if (!passwordEncoder.matches(req.getPassword(), organizer.getPassword())) {
            throw new RuntimeException("비밀번호 불일치");
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
                7,
                TimeUnit.DAYS
        );
        return LoginResDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * AccessToken 재발급
     */
    public LoginResDto refresh(String refreshToken) {

        // refresh token 검증
        Claims claims = jwtProvider.getClaims(refreshToken);

        Long userId = Long.parseLong(claims.getSubject());

        // Redis에 저장된 refresh token 조회
        String saved = redisTemplate.opsForValue()
                .get("refresh:" + userId);

        if (saved == null || !saved.equals(refreshToken)) {
            throw new RuntimeException("invalid refresh token");
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
    public MyInfoResDto getMyInfo(Long userId) {

        Organizer organizer = organizerRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

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
    public MyInfoResDto updateMyInfo(Long userId, UpdateMyInfoReqDto req) {

        Organizer organizer = organizerRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        organizer.updateInfo(req.getName(), req.getOrganization());

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
    public void changePassword(Long userId, ChangePasswordReqDto req) {

        Organizer organizer = organizerRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        if (!passwordEncoder.matches(req.getCurrentPassword(), organizer.getPassword())) {
            throw new RuntimeException("현재 비밀번호 불일치");
        }

        organizer.changePassword(
                passwordEncoder.encode(req.getNewPassword())
        );

    }


    /**
     * 행사주최자 로그아웃
     */
    public void logout(String token) {

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
    public void deleteUser(Long userId) {

        Organizer organizer = organizerRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));
        redisTemplate.delete("refresh:" + userId);
        organizerRepository.delete(organizer);
    }

    /**
     * 부스관리자 로그인
     */
    public LoginResDto boothLogin(BoothLoginReqDto req) {

        BoothManager manager = boothManagerRepository
                .findByLoginId(req.getLoginId())
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        if (!passwordEncoder.matches(req.getPassword(), manager.getPassword())) {
            throw new RuntimeException("비밀번호 불일치");
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
    public LoginResDto pinEnter(PinEnterReqDto req) {

        PinUser pinUser = pinUserRepository
                .findByPinCode(req.getPinCode())
                .orElseThrow(() -> new RuntimeException("PIN 없음"));

        String token = jwtProvider.createToken(
                pinUser.getId(),
                Role.PERSONAL_USER.name()
        );

        return LoginResDto.builder()
                .accessToken(token)
                .build();
    }
}
