package com.freeline.domain.auth.entity;

public enum BoothAdminStatus {
    CREATED,      // 1단: 생성됨
    MAILED,       // 2단: 메일 발송됨
    LOGGED_IN,    // 3단: 최초 로그인
    COMPLETED     // 4단: 비밀번호 변경 완료
}
