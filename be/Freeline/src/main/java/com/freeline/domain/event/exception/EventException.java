package com.freeline.domain.event.exception;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

public class EventException extends BusinessException {

    public EventException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
