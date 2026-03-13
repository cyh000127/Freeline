package com.freeline.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

import lombok.Getter;

@Getter
public class UpdateMyInfoReqDto {

    @NotBlank
    private String name;

    @NotBlank
    private String organization;
}
