package com.freeline.domain.booth.exception;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

public class BoothException extends BusinessException {

    public BoothException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
