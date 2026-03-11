package com.freeline.domain.eventadmin.exception;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

public class EventAdminException extends BusinessException {

	public EventAdminException(final ErrorCode errorCode) {
		super(errorCode);
	}
}
