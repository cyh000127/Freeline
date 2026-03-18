package com.freeline.domain.qr.exception;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

public class QrException extends BusinessException {

    public QrException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
