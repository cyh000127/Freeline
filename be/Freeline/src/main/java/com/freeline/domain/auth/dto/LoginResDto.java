package com.freeline.domain.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResDto {

    private String accessToken;
    private String refreshToken;
}
