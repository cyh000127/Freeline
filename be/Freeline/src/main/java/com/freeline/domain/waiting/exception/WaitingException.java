package com.freeline.domain.waiting.exception;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

public class WaitingException extends BusinessException {

    public WaitingException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
