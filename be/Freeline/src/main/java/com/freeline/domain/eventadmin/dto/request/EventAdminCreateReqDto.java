package com.freeline.domain.eventadmin.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Builder;

import io.swagger.v3.oas.annotations.media.Schema;

@Builder
public record EventAdminCreateReqDto(

	@Schema(description = "이메일", example = "admin@freeline.com")
	@NotBlank(message = "이메일은 필수입니다.")
	@Email(message = "이메일 형식이 올바르지 않습니다.")
	String email,

	@Schema(description = "비밀번호 (8자 이상)", example = "secure_password123!")
	@NotBlank(message = "비밀번호는 필수입니다.")
	@Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
	String password,

	@Schema(description = "관리자 이름", example = "최현권")
	@Size(max = 50, message = "이름은 50자 이하여야 합니다.")
	String name
) {
}
