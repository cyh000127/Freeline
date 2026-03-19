package com.freeline.domain.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.auth.dto.request.BoothAdminBulkCreateReqDto;
import com.freeline.domain.auth.dto.request.BoothAdminEmailSendReqDto;
import com.freeline.domain.auth.dto.request.ChangePasswordReqDto;
import com.freeline.domain.auth.dto.request.EmailVerifyReqDto;
import com.freeline.domain.auth.dto.request.LoginReqDto;
import com.freeline.domain.auth.dto.request.RefreshTokenReqDto;
import com.freeline.domain.auth.dto.request.SignupReqDto;
import com.freeline.domain.auth.dto.request.UpdateMyInfoReqDto;
import com.freeline.domain.auth.dto.request.VisitorEnterReqDto;
import com.freeline.domain.auth.dto.response.BoothAdminCreateResDto;
import com.freeline.domain.auth.dto.response.BoothAdminResDto;
import com.freeline.domain.auth.dto.response.LoginResDto;
import com.freeline.domain.auth.dto.response.MyInfoResDto;
import com.freeline.domain.auth.dto.response.SignupResDto;
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
     * 로그인 (행사주최자 및 부스관리자 공용)
     */
    @Operation(summary = "로그인", description = "이메일 또는 아이디를 사용하여 로그인합니다.")
    @PostMapping("/login")
    public ResponseEntity<BaseResponse<LoginResDto>> login(
            @Valid @RequestBody final LoginReqDto req
    ) {
        LoginResDto response = authService.login(req);
        return ResponseUtils.ok(response);
    }

    /**
     * 로그아웃 (공용)
     */
    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(final HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            String token = bearer.substring(7);
            authService.logout(token);
        }
        return ResponseUtils.ok(null);
    }

    /**
     * 토큰 재발급 (공용)
     */
    @Operation(summary = "Refresh Token (JWT 재발급)")
    @PostMapping("/refresh")
    public ResponseEntity<BaseResponse<LoginResDto>> refresh(
            @RequestBody final RefreshTokenReqDto req
    ) {
        return ResponseUtils.ok(authService.refresh(req.refreshToken()));
    }

    /**
     * 행사별 부스 관리자 현황 조회 (행사 주최자용)
     */
    @Operation(summary = "행사별 부스 관리자 현황 조회")
    @GetMapping("/booth-admins/events/{eventId}")
    @PreAuthorize("hasRole('EVENT_ADMIN')")
    public ResponseEntity<BaseResponse<List<BoothAdminResDto>>> getBoothAdminsByEvent(
            final Authentication authentication,
            @PathVariable final Long eventId
    ) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseUtils.ok(authService.getBoothAdminsByEvent(userId, eventId));
    }

    /**
     * 부스 관리자 일괄 생성 (행사 주최자용)
     */
    @Operation(summary = "부스 관리자 일괄 생성")
    @PostMapping("/booth-admins/bulk")
    @PreAuthorize("hasRole('EVENT_ADMIN')")
    public ResponseEntity<BaseResponse<List<BoothAdminCreateResDto>>> createBoothAdminsBulk(
            final Authentication authentication,
            @Valid @RequestBody final BoothAdminBulkCreateReqDto request
    ) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseUtils.created(authService.createBoothAdminsBulk(userId, request));
    }

    /**
     * 부스 관리자 로그인 정보 이메일 발송 (행사 주최자용)
     */
    @Operation(summary = "부스 관리자 로그인 정보 일괄 발송")
    @PostMapping("/booth-admins/send-login-info")
    @PreAuthorize("hasRole('EVENT_ADMIN')")
    public ResponseEntity<BaseResponse<Void>> sendBoothAdminLogins(
            final Authentication authentication,
            @Valid @RequestBody final BoothAdminEmailSendReqDto request
    ) {
        Long userId = Long.parseLong(authentication.getName());
        authService.sendBoothAdminLoginsBulk(userId, request);
        return ResponseUtils.ok(null);
    }

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
     * 행사주최자 내 정보 조회
     */
    @Operation(summary = "행사주최자 내 정보 조회")
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
     * 방문자 입장 (Entry Code 기반)
     */
    @Operation(summary = "방문자 입장")
    @PostMapping("/visitor-login")
    public ResponseEntity<BaseResponse<LoginResDto>> visitorLogin(
            @RequestBody final VisitorEnterReqDto request
    ) {
        LoginResDto response = authService.visitorEnter(request);
        return ResponseUtils.ok(response);
    }
}
