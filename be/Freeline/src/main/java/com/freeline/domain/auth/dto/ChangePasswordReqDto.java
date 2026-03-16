package com.freeline.domain.auth.dto;

import lombok.Getter;

@Getter
public class ChangePasswordReqDto {

    private String currentPassword;
    private String newPassword;
}
