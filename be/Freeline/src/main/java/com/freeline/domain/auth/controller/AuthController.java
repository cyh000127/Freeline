package com.freeline.domain.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.domain.auth.dto.BoothLoginReqDto;
import com.freeline.domain.auth.dto.ChangePasswordReqDto;
import com.freeline.domain.auth.dto.EmailVerifyReqDto;
import com.freeline.domain.auth.dto.LoginReqDto;
import com.freeline.domain.auth.dto.LoginResDto;
import com.freeline.domain.auth.dto.MyInfoResDto;
import com.freeline.domain.auth.dto.PinEnterReqDto;
import com.freeline.domain.auth.dto.RefreshTokenReqDto;
import com.freeline.domain.auth.dto.SignupReqDto;
import com.freeline.domain.auth.dto.SignupResDto;
import com.freeline.domain.auth.dto.UpdateMyInfoReqDto;
import com.freeline.domain.auth.entity.Organizer;
import com.freeline.domain.auth.service.AuthService;


@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 이메일 인증 코드 발송
     */
    @PostMapping("/email/send")
    public ResponseEntity<?> sendCode(
            @RequestParam String email
    ) {
        authService.sendVerificationCode(email);
        return ResponseEntity.ok().build();
    }

    /**
     * 이메일 인증 코드 검증
     */
    @PostMapping("/email/verify")
    public ResponseEntity<Void> verifyCode(
            @Valid @RequestBody EmailVerifyReqDto req
    ) {
        authService.verifyCode(req);
        return ResponseEntity.ok().build();
    }

    /**
     * 행사 주최자 회원가입
     */
    @PostMapping("/signup")
    public ResponseEntity<SignupResDto> signup(
            @Valid @RequestBody SignupReqDto req
    ) {
        return ResponseEntity.ok(authService.signup(req));
    }

    /**
     * 행사 주최자 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResDto> login(
            @Valid @RequestBody LoginReqDto req
    ) {

        LoginResDto response = authService.organizerLogin(req);

        return ResponseEntity.ok(response);
    }

    /**
     * Refresh Token (JWT 재발급)
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResDto> refresh(
            @RequestBody RefreshTokenReqDto req
    ) {
        return ResponseEntity.ok(authService.refresh(req.getRefreshToken()));
    }


    /**
     * 행사주최자 내정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<MyInfoResDto> me(Authentication authentication) {
        System.out.println("authentication = " + authentication);

        Long userId = Long.valueOf(authentication.getName());

        return ResponseEntity.ok(authService.getMyInfo(userId));
    }

    /**
     * 행사주최자 회원정보 수정
     */
    @PatchMapping("/me")
    public ResponseEntity<MyInfoResDto> updateMyInfo(
            Authentication authentication,
            @Valid @RequestBody UpdateMyInfoReqDto req
    ) {

        Long userId = Long.parseLong(authentication.getName());

        return ResponseEntity.ok(authService.updateMyInfo(userId, req));
    }

    /**
     * 행사주최자 비밀번호 변경
     */
    @PatchMapping("/password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordReqDto req) {

        Long userId = Long.parseLong(authentication.getName());

        authService.changePassword(userId, req);

        return ResponseEntity.ok().build();
    }


    /**
     * 행사주최자 회원 탈퇴
     */
    @DeleteMapping("/me")
    public ResponseEntity<Void> delete(Authentication authentication) {

        Long userId = Long.parseLong(authentication.getName());

        authService.deleteUser(userId);

        return ResponseEntity.ok().build();
    }

    /**
     * 행사주최자 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {

        String bearer = request.getHeader("Authorization");
        String token = bearer.substring(7);

        authService.logout(token);

        return ResponseEntity.ok().build();
    }


    /**
     * 부스 관리자 로그인
     */
    @PostMapping("/booth-login")
    public ResponseEntity<LoginResDto> boothLogin(
            @RequestBody BoothLoginReqDto request
    ) {

        LoginResDto response = authService.boothLogin(request);

        return ResponseEntity.ok(response);
    }

    /**
     * PIN 사용자 입장
     */
    @PostMapping("/pin-enter")
    public ResponseEntity<LoginResDto> pinEnter(
            @RequestBody PinEnterReqDto request
    ) {

        LoginResDto response = authService.pinEnter(request);

        return ResponseEntity.ok(response);
    }

}
