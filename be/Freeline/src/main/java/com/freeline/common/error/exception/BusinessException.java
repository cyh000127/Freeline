package com.freeline.common.error.exception;

import lombok.Getter;

import com.freeline.common.error.ErrorCode;
@Getter
public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

}
