package com.freeline.domain.pushnotification.exception;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

public class PushNotificationException extends BusinessException {

    public PushNotificationException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
