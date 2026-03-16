package com.freeline.common.response;

import java.util.Map;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ValidationErrorResponse {

    private Map<String, String> errors;
}
