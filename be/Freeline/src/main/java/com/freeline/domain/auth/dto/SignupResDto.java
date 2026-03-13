package com.freeline.domain.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SignupResDto {

    private Long id;
    private String email;
    private String name;
}
