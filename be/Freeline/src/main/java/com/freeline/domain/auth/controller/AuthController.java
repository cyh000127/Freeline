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

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
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
import com.freeline.domain.auth.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Auth", description = "인증/인가 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 이메일 인증 코드 발송
     */
    @Operation(summary = "이메일 인증 코드 발송")
    @PostMapping("/email/send")
    public ResponseEntity<BaseResponse<Void>> sendCode(
            @RequestParam final String email
    ) {
        authService.sendVerificationCode(email);
        return ResponseUtils.ok(null);
    }

    /**
     * 이메일 인증 코드 검증
     */
    @Operation(summary = "이메일 인증 코드 검증")
    @PostMapping("/email/verify")
    public ResponseEntity<BaseResponse<Void>> verifyCode(
            @Valid @RequestBody final EmailVerifyReqDto req
    ) {
        authService.verifyCode(req);
        return ResponseUtils.ok(null);
    }

    /**
     * 행사 주최자 회원가입
     */
    @Operation(summary = "행사 주최자 회원가입")
    @PostMapping("/signup")
    public ResponseEntity<BaseResponse<SignupResDto>> signup(
            @Valid @RequestBody final SignupReqDto req
    ) {
        return ResponseUtils.created(authService.signup(req));
    }

    /**
     * 행사 주최자 로그인
     */
    @Operation(summary = "행사 주최자 로그인")
    @PostMapping("/login")
    public ResponseEntity<BaseResponse<LoginResDto>> login(
            @Valid @RequestBody final LoginReqDto req
    ) {

        LoginResDto response = authService.organizerLogin(req);

        return ResponseUtils.ok(response);
    }

    /**
     * Refresh Token (JWT 재발급)
     */
    @Operation(summary = "Refresh Token (JWT 재발급)")
    @PostMapping("/refresh")
    public ResponseEntity<BaseResponse<LoginResDto>> refresh(
            @RequestBody final RefreshTokenReqDto req
    ) {
        return ResponseUtils.ok(authService.refresh(req.refreshToken()));
    }


    /**
     * 행사주최자 내정보 조회
     */
    @Operation(summary = "행사주최자 내정보 조회")
    @GetMapping("/me")
    public ResponseEntity<BaseResponse<MyInfoResDto>> me(final Authentication authentication) {

        Long userId = Long.valueOf(authentication.getName());

        return ResponseUtils.ok(authService.getMyInfo(userId));
    }

    /**
     * 행사주최자 회원정보 수정
     */
    @Operation(summary = "행사주최자 회원정보 수정")
    @PatchMapping("/me")
    public ResponseEntity<BaseResponse<MyInfoResDto>> updateMyInfo(
            final Authentication authentication,
            @Valid @RequestBody final UpdateMyInfoReqDto req
    ) {

        Long userId = Long.parseLong(authentication.getName());

        return ResponseUtils.ok(authService.updateMyInfo(userId, req));
    }

    /**
     * 행사주최자 비밀번호 변경
     */
    @Operation(summary = "행사주최자 비밀번호 변경")
    @PatchMapping("/password")
    public ResponseEntity<BaseResponse<Void>> changePassword(
            final Authentication authentication,
            @RequestBody final ChangePasswordReqDto req) {

        Long userId = Long.parseLong(authentication.getName());

        authService.changePassword(userId, req);

        return ResponseUtils.ok(null);
    }


    /**
     * 행사주최자 회원 탈퇴
     */
    @Operation(summary = "행사주최자 회원 탈퇴")
    @DeleteMapping("/me")
    public ResponseEntity<BaseResponse<Void>> delete(final Authentication authentication) {

        Long userId = Long.parseLong(authentication.getName());

        authService.deleteUser(userId);

        return ResponseUtils.ok(null);
    }

    /**
     * 행사주최자 로그아웃
     */
    @Operation(summary = "행사주최자 로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(final HttpServletRequest request) {

        String bearer = request.getHeader("Authorization");
        String token = bearer.substring(7);

        authService.logout(token);

        return ResponseUtils.ok(null);
    }


    /**
     * 부스 관리자 로그인
     */
    @Operation(summary = "부스 관리자 로그인")
    @PostMapping("/booth-login")
    public ResponseEntity<BaseResponse<LoginResDto>> boothLogin(
            @RequestBody final BoothLoginReqDto request
    ) {

        LoginResDto response = authService.boothLogin(request);

        return ResponseUtils.ok(response);
    }

    /**
     * PIN 사용자 입장
     */
    @Operation(summary = "PIN 사용자 입장")
    @PostMapping("/pin-enter")
    public ResponseEntity<BaseResponse<LoginResDto>> pinEnter(
            @RequestBody final PinEnterReqDto request
    ) {

        LoginResDto response = authService.pinEnter(request);

        return ResponseUtils.ok(response);
    }

}
