package com.freeline.domain.goods.exception;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;

public class GoodsException extends BusinessException {

    public GoodsException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
