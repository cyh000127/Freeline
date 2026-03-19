package com.freeline.common.response;

import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.freeline.common.error.ErrorCode;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ErrorResponse {
    private String status; // 이제 ErrorCode의 Name (예: BOOTH_NOT_FOUND)이 들어갑니다.
    private String message;
    private String method;
    private String requestUri;
    private List<FieldErrorDetail> errors;

    public static ErrorResponse of(ErrorCode errorCode, HttpServletRequest request) {
        return ErrorResponse.builder()
                .status(errorCode.name())
                .message(errorCode.getMessage())
                .method(request.getMethod())
                .requestUri(request.getRequestURI())
                .errors(new ArrayList<>())
                .build();
    }

    public static ErrorResponse of(HttpServletRequest request, ErrorCode errorCode, final String errorMessage) {
        return ErrorResponse.builder()
                .status(errorCode.name())
                .message(errorMessage)
                .method(request.getMethod())
                .requestUri(request.getRequestURI())
                .errors(new ArrayList<>())
                .build();
    }

    public void addValidationErrors(BindingResult bindingResult) {
        if (this.errors == null) {
            this.errors = new ArrayList<>();
        }
        bindingResult.getFieldErrors().forEach(this::addValidationError);
    }

    private void addValidationError(FieldError fieldError) {
        this.errors.add(
                FieldErrorDetail.builder()
                        .field(fieldError.getField())
                        .message(fieldError.getDefaultMessage())
                        .build()
        );
    }

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor(access = AccessLevel.PRIVATE)
    public static class FieldErrorDetail {
        private String field;
        private String message;
    }
}
