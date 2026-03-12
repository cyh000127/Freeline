package com.freeline.common.error;

import org.springframework.http.HttpStatus;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public enum ErrorCode {

    /**
     * Common Error (C-xxx)
     */
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "C-001", "잘못된 요청입니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "C-002", "리소스를 찾을 수 없습니다."),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "C-003", "유효하지 않은 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C-004", "서버 오류가 발생했습니다."),
    JSON_PARSING_ERROR(HttpStatus.BAD_REQUEST, "C-005", "JSON 파싱 중 오류가 발생했습니다."),
    TEMPLATE_LOADING_FAILED(HttpStatus.NOT_FOUND, "C-006", "템플릿 로딩에 실패했습니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "C-007", "요청한 리소스에 접근할 권한이 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C-008", "지원하지 않는 HTTP 메서드입니다."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "C-009", "지원하지 않는 미디어 타입입니다."),
    DATA_INTEGRITY_VIOLATION(HttpStatus.CONFLICT, "C-010", "데이터 무결성 제약을 위반했습니다."),

    /**
     * Admin Error (A-xxx)
     */
    ADMIN_NOT_FOUND(HttpStatus.NOT_FOUND, "A-001", "관리자를 찾을 수 없습니다."),
    ADMIN_EMAIL_DUPLICATE(HttpStatus.CONFLICT, "A-002", "이미 존재하는 이메일입니다."),

    /**
     * Event Error (E-xxx)
     */
    INVALID_EVENT_PERIOD(HttpStatus.BAD_REQUEST, "E-001", "행사 종료일이 시작일보다 빠를 수 없습니다."),
    EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "E-002", "존재하지 않는 행사입니다."),
    EVENT_MAP_NOT_FOUND(HttpStatus.NOT_FOUND, "E-003", "존재하지 않는 행사 지도입니다."),
    MAP_IMAGE_REQUIRED_FOR_OPEN(HttpStatus.BAD_REQUEST, "E-004", "지도 이미지 등록 전에는 OPEN 상태로 변경할 수 없습니다."),
    CANNOT_DELETE_OPEN_EVENT(
            HttpStatus.CONFLICT,
            "E-005",
            "진행 중(OPEN)인 행사는 바로 삭제할 수 없습니다. 종료 처리 후 삭제해 주세요."
    ),
    EVENT_NOT_OPEN_FOR_DASHBOARD(
            HttpStatus.BAD_REQUEST,
            "E-006",
            "진행 중(OPEN)인 행사만 대시보드를 조회할 수 있습니다."
    ),

    /**
     * Booth Error (B-xxx)
     */
    BOOTH_NOT_FOUND(HttpStatus.NOT_FOUND, "B-001", "존재하지 않는 부스입니다."),
    INVALID_BOOTH_OPERATING_HOURS(HttpStatus.BAD_REQUEST, "B-002", "부스 종료 시간은 시작 시간보다 늦어야 합니다."),
    INVALID_BOOTH_MAP_AREA(HttpStatus.BAD_REQUEST, "B-003", "부스 지도 영역 값이 올바르지 않습니다."),
    BOOTH_EVENT_MISMATCH(HttpStatus.BAD_REQUEST, "B-004", "부스와 행사의 소속 정보가 일치하지 않습니다."),

    /**
     * File Error (F-xxx)
     */
    FILE_EMPTY(HttpStatus.BAD_REQUEST, "F-001", "빈 파일은 업로드할 수 없습니다."),
    FILE_TYPE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "F-002", "허용되지 않는 파일 형식입니다."),
    FILE_NAME_INVALID(HttpStatus.BAD_REQUEST, "F-003", "유효하지 않은 파일명입니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "F-004", "파일 업로드에 실패했습니다."),
    FILE_DOWNLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "F-005", "파일 조회에 실패했습니다."),
    FILE_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "F-006", "파일 삭제에 실패했습니다."),

    /**
     * Goods Error (G-xxx)
     */
    GOODS_NOT_FOUND(HttpStatus.NOT_FOUND, "G-001", "존재하지 않는 굿즈입니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
