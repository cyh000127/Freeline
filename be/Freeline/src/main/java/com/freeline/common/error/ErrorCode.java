package com.freeline.common.error;

import org.springframework.http.HttpStatus;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public enum ErrorCode {

    /**
     * Common Error
     */
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "C001", "유효하지 않은 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C002", "서버 오류가 발생했습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C003", "지원하지 않는 HTTP 메서드입니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "C004", "요청한 리소스에 접근할 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "C005", "리소스를 찾을 수 없습니다."),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "C006", "잘못된 요청입니다."),
    JSON_PARSING_ERROR(HttpStatus.BAD_REQUEST, "C007", "JSON 파싱 중 오류가 발생했습니다."),
    TEMPLATE_LOADING_FAILED(HttpStatus.NOT_FOUND, "C008", "템플릿 로딩에 실패했습니다."),
    DATA_INTEGRITY_VIOLATION(HttpStatus.CONFLICT, "C009", "데이터 무결성 제약을 위반했습니다."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "C010", "지원하지 않는 미디어 타입입니다."),

    /**
     * Auth & User Error (정리된 버전)
     */
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다."),
    EMAIL_DUPLICATE(HttpStatus.CONFLICT, "U002", "이미 가입된 이메일입니다."),
    EMAIL_VERIFICATION_REQUIRED(HttpStatus.BAD_REQUEST, "U003", "이메일 인증이 필요합니다."),
    EMAIL_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "U004", "인증 코드가 만료되었습니다."),
    EMAIL_CODE_MISMATCH(HttpStatus.BAD_REQUEST, "U005", "인증 코드가 일치하지 않습니다."),
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "U006", "비밀번호가 일치하지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "U007", "유효하지 않은 토큰입니다."),
    LOGIN_ID_DUPLICATE(HttpStatus.CONFLICT, "U008", "이미 사용 중인 아이디입니다."),
    EMAIL_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "U009", "이메일 발송에 실패했습니다."),
    ALREADY_ASSIGNED_BOOTH_ADMIN(HttpStatus.CONFLICT, "U010", "이미 관리자가 배정된 부스입니다."),
    VISITOR_NOT_FOUND(HttpStatus.NOT_FOUND, "U011", "방문자 정보를 찾을 수 없습니다."),
    EMAIL_ALREADY_SENT(HttpStatus.CONFLICT, "U012", "이미 인증 코드가 발송되었습니다."),

    /**
     * Event Error
     */
    EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "E001", "존재하지 않는 행사입니다."),
    INVALID_EVENT_PERIOD(HttpStatus.BAD_REQUEST, "E002", "행사 종료일이 시작일보다 빠를 수 없습니다."),
    EVENT_MAP_NOT_FOUND(HttpStatus.NOT_FOUND, "E003", "존재하지 않는 행사 지도입니다."),
    MAP_IMAGE_REQUIRED_FOR_OPEN(HttpStatus.BAD_REQUEST, "E004", "지도 이미지 등록 전에는 OPEN 상태로 변경할 수 없습니다."),
    CANNOT_DELETE_OPEN_EVENT(HttpStatus.CONFLICT, "E005", "진행 중인 행사는 바로 삭제할 수 없습니다."),
    EVENT_NOT_OPEN_FOR_DASHBOARD(HttpStatus.BAD_REQUEST, "E006", "진행 중인 행사만 대시보드를 조회할 수 있습니다."),

    /**
     * Booth Error
     */
    BOOTH_NOT_FOUND(HttpStatus.NOT_FOUND, "B001", "존재하지 않는 부스입니다."),
    INVALID_BOOTH_OPERATING_HOURS(HttpStatus.BAD_REQUEST, "B002", "부스 종료 시간은 시작 시간보다 늦어야 합니다."),
    INVALID_BOOTH_MAP_AREA(HttpStatus.BAD_REQUEST, "B003", "부스 지도 영역 값이 올바르지 않습니다."),
    BOOTH_EVENT_MISMATCH(HttpStatus.BAD_REQUEST, "B004", "부스와 행사의 소속 정보가 일치하지 않습니다."),
    MAX_WAITING_EXCEEDED(HttpStatus.FORBIDDEN, "B005", "최대 활성 대기 개수를 초과할 수 없습니다."),
    ALREADY_WAITING_FOR_BOOTH(HttpStatus.CONFLICT, "B006", "이미 해당 부스에 진행 중인 대기가 존재합니다."),

    /**
     * Waiting Error (복구된 상세 코드)
     */
    WAITING_ACCESS_DENIED(HttpStatus.FORBIDDEN, "W001", "본인의 대기 내역만 제어할 수 있습니다."),
    INVALID_WAITING_STATUS_FOR_CANCEL(HttpStatus.BAD_REQUEST, "W002", "이미 종료되거나 취소된 대기는 취소할 수 없습니다."),
    INVALID_WAITING_STATUS_FOR_EXIT(HttpStatus.BAD_REQUEST, "W003", "입장 상태인 경우에만 퇴장 처리할 수 있습니다."),
    INVALID_WAITING_STATUS_FOR_POSTPONE(HttpStatus.BAD_REQUEST, "W004", "대기 중 상태에서만 순번을 미룰 수 있습니다."),
    POSTPONE_LIMIT_EXCEEDED(HttpStatus.FORBIDDEN, "W005", "순번 미루기 허용 횟수를 초과했습니다."),
    CANNOT_POSTPONE_LAST_IN_LINE(HttpStatus.BAD_REQUEST, "W006", "대기열의 마지막 순서이므로 더 이상 미룰 수 없습니다."),
    CALL_CANDIDATE_NOT_FOUND(HttpStatus.NOT_FOUND, "W007", "호출 가능한 대기자가 없습니다."),
    INVALID_STATUS_FOR_ADMIT(HttpStatus.BAD_REQUEST, "W008", "도착 확인이 완료된 대기만 입장 처리할 수 있습니다."),
    INVALID_WAITING_STATUS(HttpStatus.BAD_REQUEST, "W009", "변경할 수 없는 대기 상태입니다."),

    /**
     * QR & File Error
     */
    QR_NOT_FOUND(HttpStatus.NOT_FOUND, "Q001", "유효한 QR 정보를 찾을 수 없습니다."),
    QR_INVALID_PAYLOAD(HttpStatus.BAD_REQUEST, "Q002", "QR payload 형식이 올바르지 않습니다."),
    QR_EXPIRED(HttpStatus.BAD_REQUEST, "Q003", "QR 유효 시간이 만료되었습니다."),
    QR_SCAN_IN_PROGRESS(HttpStatus.CONFLICT, "Q004", "동일 사용자에 대한 QR 처리 중입니다."),
    QR_REISSUE_COOLDOWN(HttpStatus.CONFLICT, "Q005", "QR 재발급은 잠시 후 다시 시도할 수 있습니다."),
    QR_WAITING_NOT_CALLED(HttpStatus.BAD_REQUEST, "Q006", "호출 상태의 대기를 찾을 수 없습니다."),
    QR_WAITING_EXPIRED(HttpStatus.BAD_REQUEST, "Q007", "호출 유효 시간이 만료되었습니다."),
    
    FILE_EMPTY(HttpStatus.BAD_REQUEST, "F001", "빈 파일은 업로드할 수 없습니다."),
    FILE_TYPE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "F002", "허용되지 않는 파일 형식입니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "F003", "파일 업로드에 실패했습니다."),
    GOODS_NOT_FOUND(HttpStatus.NOT_FOUND, "G001", "존재하지 않는 굿즈입니다."),

    /**
     * Push Notification Error
     */
    PUSH_NOTIFICATION_TOKEN_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", "저장된 FCM 토큰을 찾을 수 없습니다."),
    PUSH_NOTIFICATION_NOT_CONFIGURED(HttpStatus.INTERNAL_SERVER_ERROR, "P002", "FCM 발송 설정이 준비되지 않았습니다."),
    PUSH_NOTIFICATION_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "P003", "푸시 알림 발송에 실패했습니다."),
    PUSH_NOTIFICATION_WAITING_STATUS_MISMATCH(HttpStatus.BAD_REQUEST, "P004", "현재 대기 상태에서는 해당 알림을 보낼 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
