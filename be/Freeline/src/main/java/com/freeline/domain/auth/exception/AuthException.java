package com.freeline.domain.auth.exception;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

public class AuthException extends BusinessException {
    public AuthException(ErrorCode errorCode) {
        super(errorCode);
    }
}
