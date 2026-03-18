package com.freeline.domain.auth.dto;

public record ChangePasswordReqDto(
        String currentPassword,
        String newPassword
) {
}
