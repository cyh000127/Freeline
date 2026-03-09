package com.freeline.common.error.exception.handler;

import org.springframework.security.access.AccessDeniedException;

import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;
import com.freeline.common.response.BaseResponse;
import com.freeline.common.response.ErrorResponse;
import com.freeline.common.util.LoggingUtils;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(Exception.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleException(Exception ex, HttpServletRequest request) {
		LoggingUtils.logException("지정되지 않은 예외 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR, request);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleBusinessException(
		BusinessException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("BusinessException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ex.getErrorCode(), request);
		return ResponseEntity.status(ex.getErrorCode().getHttpStatus()).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleConstraintViolation(
		ConstraintViolationException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("ConstraintViolationException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT, request);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleHttpMessageNotReadable(
		HttpMessageNotReadableException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("HttpMessageNotReadableException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT, request);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(MissingServletRequestParameterException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleMissingServletRequestParameter(
		MissingServletRequestParameterException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("MissingServletRequestParameterException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT, request);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleMethodArgumentTypeMismatch(
		MethodArgumentTypeMismatchException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("MethodArgumentTypeMismatchException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT, request);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleHttpRequestMethodNotSupported(
		HttpRequestMethodNotSupportedException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("HttpRequestMethodNotSupportedException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.METHOD_NOT_ALLOWED, request);
		return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(HttpMediaTypeNotSupportedException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleHttpMediaTypeNotSupported(
		HttpMediaTypeNotSupportedException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("HttpMediaTypeNotSupportedException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.UNSUPPORTED_MEDIA_TYPE, request);
		return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleDataIntegrityViolation(
		DataIntegrityViolationException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("DataIntegrityViolationException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.DATA_INTEGRITY_VIOLATION, request);
		return ResponseEntity.status(HttpStatus.CONFLICT).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(DataAccessException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleDataAccessException(
		DataAccessException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("DataAccessException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR, request);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleAccessDeniedException(
		AccessDeniedException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("AccessDeniedException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.ACCESS_DENIED, request);
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(BaseResponse.fail(response));
	}

	@ExceptionHandler(NoResourceFoundException.class)
	public ResponseEntity<BaseResponse<ErrorResponse>> handleNoResourceFoundException(
		NoResourceFoundException ex,
		HttpServletRequest request
	) {
		LoggingUtils.logException("NoResourceFoundException 발생", ex, request);
		ErrorResponse response = ErrorResponse.of(ErrorCode.NOT_FOUND, request);
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(BaseResponse.fail(response));
	}

}
