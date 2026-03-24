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
     * Auth Error (U-xxx)
     */
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U-001", "사용자를 찾을 수 없습니다."),
    EMAIL_DUPLICATE(HttpStatus.CONFLICT, "U-002", "이미 가입된 이메일입니다."),
    EMAIL_VERIFICATION_REQUIRED(HttpStatus.BAD_REQUEST, "U-003", "이메일 인증이 필요합니다."),
    EMAIL_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "U-004", "인증 코드가 만료되었습니다."),
    EMAIL_CODE_MISMATCH(HttpStatus.BAD_REQUEST, "U-005", "인증 코드가 일치하지 않습니다."),
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "U-006", "비밀번호가 일치하지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "U-007", "유효하지 않은 토큰입니다."),
    LOGIN_ID_DUPLICATE(HttpStatus.CONFLICT, "U-008", "이미 사용 중인 아이디입니다."),
    EMAIL_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "U-009", "이메일 발송에 실패했습니다."),
    ALREADY_ASSIGNED_BOOTH_ADMIN(HttpStatus.CONFLICT, "U-010", "이미 관리자가 배정된 부스입니다."),
    VISITOR_NOT_FOUND(HttpStatus.NOT_FOUND, "U-011", "방문자 정보를 찾을 수 없습니다."),
    EMAIL_ALREADY_SENT(HttpStatus.CONFLICT, "U-012", "이미 인증 코드가 발송되었습니다."),

    /**
     * Event Error (E-xxx)
     */
    INVALID_EVENT_PERIOD(HttpStatus.BAD_REQUEST, "E-001", "행사 종료일이 시작일보다 빠를 수 없습니다."),
    EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "E-002", "존재하지 않는 행사입니다."),
    EVENT_MAP_NOT_FOUND(HttpStatus.NOT_FOUND, "E-003", "존재하지 않는 행사 지도입니다."),
    MAP_IMAGE_REQUIRED_FOR_OPEN(HttpStatus.BAD_REQUEST, "E-004", "지도 이미지 등록 전에는 OPEN 상태로 변경할 수 없습니다."),
    CANNOT_DELETE_OPEN_EVENT(HttpStatus.CONFLICT, "E-005", "진행 중(OPEN)인 행사는 바로 삭제할 수 없습니다. 종료 처리 후 삭제해 주세요."),
    EVENT_NOT_OPEN_FOR_DASHBOARD(HttpStatus.BAD_REQUEST, "E-006", "진행 중(OPEN)인 행사만 대시보드를 조회할 수 있습니다."),

    /**
     * Booth Error (B-xxx)
     */
    BOOTH_NOT_FOUND(HttpStatus.NOT_FOUND, "B-001", "존재하지 않는 부스입니다."),
    INVALID_BOOTH_OPERATING_HOURS(HttpStatus.BAD_REQUEST, "B-002", "부스 종료 시간은 시작 시간보다 늦어야 합니다."),
    INVALID_BOOTH_MAP_AREA(HttpStatus.BAD_REQUEST, "B-003", "부스 지도 영역 값이 올바르지 않습니다."),
    BOOTH_EVENT_MISMATCH(HttpStatus.BAD_REQUEST, "B-004", "부스와 행사의 소속 정보가 일치하지 않습니다."),
    MAX_WAITING_EXCEEDED(HttpStatus.FORBIDDEN, "B-005", "최대 활성 대기 개수(3개)를 초과할 수 없습니다."),
    ALREADY_WAITING_FOR_BOOTH(HttpStatus.CONFLICT, "B-006", "이미 해당 부스에 진행 중인 대기가 존재합니다."),

    WAITING_ACCESS_DENIED(HttpStatus.FORBIDDEN, "B-007", "본인의 대기 내역만 제어할 수 있습니다."),
    INVALID_WAITING_STATUS_FOR_CANCEL(HttpStatus.BAD_REQUEST, "B-008", "이미 종료되거나 취소된 대기는 취소할 수 없습니다."),
    INVALID_WAITING_STATUS_FOR_EXIT(HttpStatus.BAD_REQUEST, "B-009", "입장(ENTERED) 상태인 경우에만 퇴장 처리할 수 있습니다."),
    INVALID_WAITING_STATUS_FOR_POSTPONE(HttpStatus.BAD_REQUEST, "B-010", "대기 중(WAITING) 상태에서만 순번을 미룰 수 있습니다."),
    POSTPONE_LIMIT_EXCEEDED(HttpStatus.FORBIDDEN, "B-011", "순번 미루기 허용 횟수를 초과했습니다."),
    CANNOT_POSTPONE_LAST_IN_LINE(HttpStatus.BAD_REQUEST, "B-012", "대기열의 마지막 순서이므로 더 이상 미룰 수 없습니다."),
    CALL_CANDIDATE_NOT_FOUND(HttpStatus.NOT_FOUND, "B-013", "호출 가능한 대기자가 없습니다."),
    INVALID_STATUS_FOR_ADMIT(HttpStatus.BAD_REQUEST, "B-014", "도착 확인(REGISTERED)이 완료된 대기만 입장 처리할 수 있습니다."),

    /**
     * File Error (F-xxx)
     */
    FILE_EMPTY(HttpStatus.BAD_REQUEST, "F-001", "빈 파일은 업로드할 수 없습니다."),
    FILE_TYPE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "F-002", "허용되지 않는 파일 형식입니다."),
    FILE_NAME_INVALID(HttpStatus.BAD_REQUEST, "F-003", "유효하지 않은 파일명입니다."),
    FILE_SIZE_EXCEEDED(HttpStatus.valueOf(413), "F-004", "업로드 가능한 파일 용량을 초과했습니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "F-005", "파일 업로드에 실패했습니다."),
    FILE_DOWNLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "F-006", "파일 조회에 실패했습니다."),
    FILE_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "F-007", "파일 삭제에 실패했습니다."),

    /**
     * Goods Error (G-xxx)
     */
    GOODS_NOT_FOUND(HttpStatus.NOT_FOUND, "G-001", "존재하지 않는 굿즈입니다."),

    /**
     * QR Error (Q-xxx)
     */
    QR_NOT_FOUND(HttpStatus.NOT_FOUND, "Q-001", "유효한 QR 정보를 찾을 수 없습니다."),
    QR_INVALID_PAYLOAD(HttpStatus.BAD_REQUEST, "Q-002", "QR payload 형식이 올바르지 않습니다."),
    QR_EXPIRED(HttpStatus.BAD_REQUEST, "Q-003", "QR 유효 시간이 만료되었습니다."),
    QR_SCAN_IN_PROGRESS(HttpStatus.CONFLICT, "Q-004", "동일 사용자에 대한 QR 처리 중입니다."),
    QR_REISSUE_COOLDOWN(HttpStatus.CONFLICT, "Q-005", "QR 재발급은 잠시 후 다시 시도할 수 있습니다."),
    QR_WAITING_NOT_CALLED(HttpStatus.BAD_REQUEST, "Q-006", "호출 상태의 대기를 찾을 수 없습니다."),
    QR_WAITING_EXPIRED(HttpStatus.BAD_REQUEST, "Q-007", "호출 유효 시간이 만료되었습니다."),

    /**
     * Push Notification Error (P-xxx)
     */
    PUSH_NOTIFICATION_TOKEN_NOT_FOUND(HttpStatus.NOT_FOUND, "P-001", "저장된 FCM 토큰을 찾을 수 없습니다."),
    PUSH_NOTIFICATION_NOT_CONFIGURED(HttpStatus.INTERNAL_SERVER_ERROR, "P-002", "FCM 발송 설정이 아직 준비되지 않았습니다."),
    PUSH_NOTIFICATION_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "P-003", "푸시 알림 발송에 실패했습니다."),
    PUSH_NOTIFICATION_WAITING_STATUS_MISMATCH(HttpStatus.BAD_REQUEST, "P-004", "현재 대기 상태에서는 해당 알림을 보낼 수 없습니다."),

    /**
     * Report Error (R-xxx)
     */
    HDFS_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "R-001", "HDFS 데이터 업로드에 실패했습니다."),
    REPORT_EVENT_NOT_CLOSED(HttpStatus.BAD_REQUEST, "R-002", "종료된 행사만 리포트를 생성할 수 있습니다."),
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "R-003", "해당 행사의 리포트 데이터를 찾을 수 없습니다."),
    REPORT_ALREADY_GENERATING(HttpStatus.CONFLICT, "R-004", "리포트가 이미 생성 중입니다."),
    REPORT_GENERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "R-005", "리포트 생성에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
