package com.freeline.common.error.exception.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;
import com.freeline.common.response.BaseResponse;
import com.freeline.common.response.ErrorResponse;
import com.freeline.common.util.LoggingUtils;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final HttpStatus REQUEST_ENTITY_TOO_LARGE = HttpStatus.valueOf(413);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleException(
            final Exception ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logUnhandledException("정의되지 않은 예외 발생", ex, request);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR, request);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(BaseResponse.fail(response, HttpStatus.INTERNAL_SERVER_ERROR));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleBusinessException(
            final BusinessException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("BusinessException 발생", ex, request, ex.getErrorCode().getHttpStatus());
        final ErrorResponse response = ErrorResponse.of(ex.getErrorCode(), request);
        return ResponseEntity.status(ex.getErrorCode().getHttpStatus())
                .body(BaseResponse.fail(response, ex.getErrorCode().getHttpStatus()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleIllegalArgumentException(
            final IllegalArgumentException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("IllegalArgumentException 발생", ex, request, HttpStatus.BAD_REQUEST);
        final ErrorResponse response = ErrorResponse.of(request, ErrorCode.INVALID_INPUT, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(BaseResponse.fail(response, HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleMethodArgumentNotValid(
            final MethodArgumentNotValidException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logValidationException(ex, request);

        final ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT, request);
        response.addValidationErrors(ex.getBindingResult());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(BaseResponse.fail(response, HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleConstraintViolation(
            final ConstraintViolationException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("ConstraintViolationException 발생", ex, request, HttpStatus.BAD_REQUEST);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT, request);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(BaseResponse.fail(response, HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleHttpMessageNotReadable(
            final HttpMessageNotReadableException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("HttpMessageNotReadableException 발생", ex, request, HttpStatus.BAD_REQUEST);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.BAD_REQUEST, request);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(BaseResponse.fail(response, HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleHttpRequestMethodNotSupported(
            final HttpRequestMethodNotSupportedException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("HttpRequestMethodNotSupportedException 발생",
                ex, request, HttpStatus.METHOD_NOT_ALLOWED);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.METHOD_NOT_ALLOWED, request);
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(BaseResponse.fail(response, HttpStatus.METHOD_NOT_ALLOWED));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleHttpMediaTypeNotSupported(
            final HttpMediaTypeNotSupportedException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("HttpMediaTypeNotSupportedException 발생",
                ex, request, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.UNSUPPORTED_MEDIA_TYPE, request);
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(BaseResponse.fail(response, HttpStatus.UNSUPPORTED_MEDIA_TYPE));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleNoResourceFound(
            final NoResourceFoundException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("NoResourceFoundException 발생", ex, request, HttpStatus.NOT_FOUND);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.NOT_FOUND, request);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(BaseResponse.fail(response, HttpStatus.NOT_FOUND));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleMethodArgumentTypeMismatch(
            final MethodArgumentTypeMismatchException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("MethodArgumentTypeMismatchException 발생", ex, request, HttpStatus.BAD_REQUEST);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT, request);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(BaseResponse.fail(response, HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleMissingServletRequestParameter(
            final MissingServletRequestParameterException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("MissingServletRequestParameterException 발생", ex, request, HttpStatus.BAD_REQUEST);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.BAD_REQUEST, request);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(BaseResponse.fail(response, HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleDataIntegrityViolation(
            final DataIntegrityViolationException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("DataIntegrityViolationException 발생", ex, request, HttpStatus.CONFLICT);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.DATA_INTEGRITY_VIOLATION, request);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(BaseResponse.fail(response, HttpStatus.CONFLICT));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleMaxUploadSizeExceeded(
            final MaxUploadSizeExceededException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("MaxUploadSizeExceededException 발생", ex, request, REQUEST_ENTITY_TOO_LARGE);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.FILE_SIZE_EXCEEDED, request);
        return ResponseEntity.status(REQUEST_ENTITY_TOO_LARGE)
                .body(BaseResponse.fail(response, REQUEST_ENTITY_TOO_LARGE));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleDataAccess(
            final DataAccessException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("DataAccessException 발생", ex, request, HttpStatus.INTERNAL_SERVER_ERROR);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR, request);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(BaseResponse.fail(response, HttpStatus.INTERNAL_SERVER_ERROR));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<BaseResponse<ErrorResponse>> handleAccessDenied(
            final AccessDeniedException ex,
            final HttpServletRequest request
    ) {
        LoggingUtils.logHandledException("AccessDeniedException 발생", ex, request, HttpStatus.FORBIDDEN);
        final ErrorResponse response = ErrorResponse.of(ErrorCode.ACCESS_DENIED, request);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(BaseResponse.fail(response, HttpStatus.FORBIDDEN));
    }
}
