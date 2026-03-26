package com.freeline.common.util;

import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@UtilityClass
public class LoggingUtils {

    public void logHandledException(
            final String prefix,
            final Exception ex,
            final HttpServletRequest request,
            final HttpStatus status
    ) {
        final String message = buildExceptionMessage(prefix, ex, request);
        if (status.is5xxServerError()) {
            log.error(message);
            return;
        }
        log.warn(message);
    }

    public void logUnhandledException(final String prefix, final Exception ex, final HttpServletRequest request) {
        log.error(buildExceptionMessage(prefix, ex, request), ex);
    }

    /**
     * 유효성 검사 예외를 로깅합니다. 실패한 필드와 메시지를 요약해 출력합니다.
     *
     * @param ex      MethodArgumentNotValidException
     * @param request 요청 정보
     */
    public void logValidationException(final MethodArgumentNotValidException ex, final HttpServletRequest request) {
        final String errorFields = ex.getBindingResult().getFieldErrors().stream()
                .map(LoggingUtils::formatFieldError)
                .collect(Collectors.joining(", "));

        log.warn("유효성 검사 실패 | 예외 발생 지점[{} {}] | 실패 필드: {}",
                request.getMethod(),
                request.getRequestURI(),
                errorFields);
    }

    private String formatFieldError(final FieldError error) {
        return String.format("[field: %s, message: %s]", error.getField(), error.getDefaultMessage());
    }

    private String buildExceptionMessage(
            final String prefix,
            final Exception ex,
            final HttpServletRequest request
    ) {
        return String.format("%s: %s | 예외 발생 지점[%s %s]",
                prefix,
                ex.getMessage(),
                request.getMethod(),
                request.getRequestURI());
    }
}
