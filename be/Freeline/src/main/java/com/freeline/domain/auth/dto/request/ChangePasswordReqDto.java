package com.freeline.domain.auth.dto.request;

public record ChangePasswordReqDto(
        String currentPassword,
        String newPassword
) {
}
