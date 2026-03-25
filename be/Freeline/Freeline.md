# Freeline.md

This file provides guidance to AI Code Assistants when working with code in this repository.

## Project Overview

**Freeline** - Spring Boot 기반 백엔드 애플리케이션

- Java 21, Gradle 빌드 시스템
- PostgreSQL (Docker)
- Redis (Docker), Spring Security, OAuth2, WebSocket 지원
- Swagger UI (SpringDoc OpenAPI)
- Cloudflare R2 기반 파일 업로드 지원

## Build and Run Commands

**Windows 환경 (현재 개발 환경):**

```bash
# 빌드
gradlew build

# 빌드 (테스트 스킵)
gradlew build -x test

# 프로젝트 클린
gradlew clean

# 클린 후 빌드
gradlew clean build

# 테스트 실행
gradlew test

# 특정 테스트 클래스만 실행
gradlew test --tests "com.freeline.domain.member.service.MemberServiceTest"

# 특정 테스트 메서드만 실행
gradlew test --tests "*.MemberServiceTest.회원_생성_성공_테스트"

# 애플리케이션 실행 (로컬 프로파일)
gradlew bootRun --args="--spring.profiles.active=local"

# 의존성 확인
gradlew dependencies
```

**Linux/Mac 환경:**
위 명령어의 `gradlew`를 `./gradlew`로 변경하여 사용

**프로파일:**

- `local`: 로컬 개발용 (Docker PostgreSQL/Redis)
- `live`: 운영 환경 (PostgreSQL)

활성 프로파일은 환경변수 `SPRING_PROFILES_ACTIVE`로 제어

## Architecture

### 레이어 구조

```
Controller (HTTP 엔드포인트)
    ↓
Service (비즈니스 로직)
    ↓
Repository (데이터 접근)
    ↓
Entity (도메인 모델)
```

**핵심 원칙:**

- Controller는 Service만 의존
- 응답 반환: `ResponseUtils.ok()`, `ResponseUtils.created()` 사용
- Service는 비즈니스 로직 담당, `@Transactional` 적용
- 읽기 전용 메서드에는 `@Transactional(readOnly = true)` 적용

### 패키지 구조

```
com.freeline
├── common/                    # 공통 인프라
│   ├── config/               # 설정 (Security, CORS, Swagger)
│   ├── event/                # 공통 이벤트/MQ payload/publisher
│   ├── entity/               # BaseEntity (생성/수정 시각)
│   ├── error/                # 예외 처리
│   │   ├── ErrorCode.java   # 에러 코드 enum (도메인별 prefix)
│   │   ├── exception/
│   │   │   ├── BusinessException.java
│   │   │   └── handler/GlobalExceptionHandler.java
│   ├── file/                 # 공통 파일 업로드/조회
│   ├── response/             # 응답 포맷
│   │   ├── BaseResponse.java
│   │   ├── ErrorResponse.java
│   │   └── PageResponse.java
│   └── util/                 # 유틸리티
│       ├── LoggingUtils.java
│       ├── ResponseUtils.java
│       └── TimeUtils.java
└── domain/                    # 도메인별 구조
    └── {domain}/
        ├── controller/
        │   └── {Domain}Controller.java
        ├── service/
        │   └── {Domain}Service.java
        ├── dto/
        │   ├── request/
        │   │   └── *ReqDto.java
        │   └── response/
        │       └── *ResDto.java
        ├── converter/
        │   └── {Domain}Converter.java
        ├── repository/
        │   └── {Domain}Repository.java
        └── entity/
            └── {Domain}.java
```

## Response Format

**성공 응답:**

```java
ResponseUtils.ok(data)       // 200 OK
ResponseUtils.

created(data)  // 201 Created
ResponseUtils.

noContent()    // 204 No Content
```

**JSON 구조:**

```json
{
  "success": true,
  "data": {
    "...": "..."
  },
  "error": null,
  "timestamp": "2025-01-19 12:34:56"
}
```

**에러 응답:**

- `GlobalExceptionHandler`가 모든 예외를 `BaseResponse.fail(ErrorResponse)`로 변환
- `ErrorCode` enum의 도메인별 prefix 사용
- `BusinessException`을 상속한 도메인별 예외 클래스 사용

## Entity 규칙

- 모든 엔티티는 `BaseEntity`를 상속하여 `createdAt`, `updatedAt` 자동 관리
- Lombok 어노테이션: `@Builder`, `@NoArgsConstructor(access = PROTECTED)`, `@AllArgsConstructor(access = PROTECTED)`
- 수정 메서드는 `update*()` 네이밍 사용
- 모든 메서드 매개변수에는 `final` 키워드 사용
- DTO ↔ Entity 변환은 정적 팩토리 메서드 대신 Converter 클래스 사용

```java
public void updateName(final String name) {
    this.name = name;
}
```

## DTO 규칙

- `record` 클래스 사용
- 네이밍: `*ReqDto`, `*ResDto`
- Validation: `@NotNull`, `@NotBlank`, `@Email` 등 사용
- `@Builder` 어노테이션 사용

## Converter 패턴

- `@UtilityClass` 사용
- Entity ↔ DTO 변환 담당

**네이밍 규칙:**

- DTO → Entity: `toEntity(final XxxReqDto dto)`
- Entity → DTO: `toXxxResDto(final Entity entity)`

## Validation 계층 분리

**1단계: DTO Validation (`@Valid`)**

- 위치: Controller 진입 시점
- 역할: null 체크, 길이, 패턴, 타입 등 형식 검증

**2단계: Business Validation**

- 위치: Service 내부
- 역할: DB 조회가 필요한 비즈니스 규칙 검증
- 도구: Repository 조회 + `BusinessException` 발생

> 별도의 Validator 클래스는 만들지 않음

## Code Style

**Import 규칙:**

- wildcard import 금지
- static import 금지
- 정렬 순서: `java` → `javax` → `jakarta` → `org` → `lombok` → `com`
- import 그룹 사이에는 빈 줄 1줄만 허용
- 체크스타일 규칙이 문서형 코드스타일보다 우선하며, 모든 Java 코드는 `checkstyleMain`, `checkstyleTest`를 통과해야 완료로 간주
- AI Code Assistant는 Java 파일을 수정한 경우 응답 전 체크스타일까지 확인하고, import 순서와 그룹 분리까지 정확히 맞춰서 작성

**코딩 원칙:**

- DRY (Don't Repeat Yourself)
- SOLID 원칙
- 객체 지향적 설계

## Controller 규칙

- `@ApiResponse` 사용 안 함
- `ResponseUtils` 필수 사용
- Swagger 태그는 도메인별 `@Tag(name = "...")` 사용
- API base path는 `/api/v1/{domain}` 형식으로 시작
- 도메인 컨트롤러의 하위 경로는 자신의 도메인 세그먼트 뒤에서만 확장
- 다른 도메인 식별자가 필요해도 경로 시작은 현재 도메인으로 고정
- 예시:
    - Booth `/api/v1/booths/events/{eventId}`
    - BoothMap `/api/v1/boothmaps/events/{eventId}`
    - Goods `/api/v1/goods/booths/{boothId}`
    - EventAdmin `/api/v1/event-admins`

## Transaction Management

- `@Transactional`은 Service 레이어에만 사용
- 읽기 전용 메서드: `@Transactional(readOnly = true)`
- 기본 전파 속성: `Propagation.REQUIRED`
- `RuntimeException` 및 하위 예외는 자동 롤백

## Exception Handling

- 도메인별 Exception은 `BusinessException`을 상속
- ErrorCode 네이밍 컨벤션:
    - Common: `C-xxx`
    - Admin: `A-xxx`
    - Event: `E-xxx`
    - Booth: `B-xxx`
    - File: `F-xxx`
    - Goods: `G-xxx`
    - PushNotification: `P-xxx`

## Database

**JPA 설정:**

- `spring.jpa.open-in-view: false`
- JPA Auditing 활성화
- 기준 스키마는 `src/main/resources/ddl.sql`로 관리
- 기본 JPA 설정은 `ddl-auto: none`
- 필요할 때만 `JPA_DDL_AUTO` 환경변수로 `validate` 또는 `update`를 지정
- 기존 DB 위에서 실행할 때는 엔티티-스키마 불일치로 부팅이 막히지 않도록 자동 검증을 기본 비활성화

## Firebase / FCM Key Rules

- Firebase 서비스 계정 JSON 파일은 Git에 절대 커밋하지 않음
- 로컬 개발에서는 프로젝트 루트의 `secrets/` 디렉토리 또는 프로젝트 바깥 비공개 경로에만 저장
- 권장 파일명 예시: `service-account.json`, `freeline-firebase-service-account.json`
- Firebase 키는 서비스 계정 JSON 원본을 Base64로 인코딩해 환경변수로만 주입
- 환경변수:
    - `FIREBASE_PROJECT_ID`
    - `FIREBASE_SERVICE_ACCOUNT_BASE64`
- `application.yml`에서는 위 환경변수만 참조하고, 실제 JSON 경로/내용을 하드코딩하지 않음
- 운영 환경에서는 JSON 파일 자체를 두지 않고 Base64 값만 secret manager 또는 환경변수로 주입
- 서비스 계정 JSON이 한 번이라도 Git에 올라갔다면 즉시 폐기 후 새 키를 발급받아야 함

예시:

```yml
firebase:
  project-id: ${FIREBASE_PROJECT_ID:}
  service-account-base64: ${FIREBASE_SERVICE_ACCOUNT_BASE64:}
```

**로컬 환경 DB:**

- PostgreSQL과 Redis 모두 Docker로 실행
- H2 in-memory DB 사용 안 함

**Repository 규칙:**

- `JpaRepository` 상속
- 복잡한 쿼리: `@Query` 사용
- QueryDSL 사용 안 함

## Logging Strategy

**로그 형식:**

```
[Domain] 행위 완료 {key: value}
```

**규칙:**

- Service 계층에서 주요 작업 완료 시 INFO 로그
- 예외는 `GlobalExceptionHandler`에서 `LoggingUtils` 사용
- 비밀번호, 토큰 등 민감 정보 로그 출력 금지

## Testing

**테스트 구조:**

- Given-When-Then 패턴
- 메서드명은 한글 사용
- JUnit 5 + Mockito
- 테스트 코드도 static import 금지

**테스트 분류:**

- 단위 테스트: `*ServiceTest.java` (Mockito)
- 통합 테스트: `*IntegrationTest.java` (`@SpringBootTest`)

## File Upload Rules

- 공통 파일 업로드 로직은 `common/file` 패키지에서 관리한다.
- Cloudflare R2 업로드는 `FileService` → `CloudflareStorageUtil` 흐름을 사용한다.
- 파일 검증은 `MediaFileValidator`에서 수행하며, 허용된 MIME 타입만 통과시킨다.
- 도메인 서비스는 직접 `S3Client`를 다루지 않고 공통 파일 서비스 또는 스토리지 유틸을 통해서만 파일을 처리한다.
- 공개 파일 URL은 `cloudflare.outer-prefix` 기준으로 생성한다.
- 파일 삭제 시에는 저장된 공개 URL에서 object key를 추출해 R2에서도 함께 삭제한다.

## Cloudflare Rules

- IDE에서 SonarQube for IDE 또는 SonarLint를 사용할 때 `Freeline.md`는 로컬 분석 제외 파일로 설정한다.
- Connected Mode를 사용하는 경우 SonarQube 서버의 프로젝트 exclusion에도 `**/Freeline.md`를 추가한다.
- `.md` 파일이 Java 코드처럼 분석되면 IntelliJ의 `Editor -> File Types`에서 `*.md`가 Markdown으로 연결되어 있는지 먼저 확인한다.
- 필수 환경변수는 `CLOUDFLARE_ENDPOINT`, `CLOUDFLARE_BUCKET`, `CLOUDFLARE_ACCESS_KEY`, `CLOUDFLARE_SECRET_KEY`,
  `CLOUDFLARE_OUTER_PREFIX`이다.
- Cloudflare 관련 기능은 테스트 환경에서도 애플리케이션이 뜰 수 있도록 `src/test/resources/application.yml`에 더미 설정을 둔다.
- 업로드/조회/삭제 실패는 공통 파일 에러코드(`F-xxx`)로 처리한다.
- Cloudflare 업로드 경로 규칙:
    - 부스 관련 사진: `freeline/booth`
    - 상품 관련 사진: `freeline/goods`
    - 지도 관련 사진: `freeline/map`

## Security Configuration

- 현재 상태: 인증 미구현 (모든 요청 `permitAll()`)
- Stateless 세션: `SessionCreationPolicy.STATELESS`
- CORS: `CorsConfig`에서 허용 도메인 관리
- 비활성화: CSRF, HTTP Basic, Form Login

## Swagger/OpenAPI

- URL: `http://localhost:8080/swagger-ui/index.html`
- API 문서 자동 생성

## 새 도메인 추가 체크리스트

1. Entity - `BaseEntity` 상속, `@Builder`, `final` 매개변수
2. Repository - `JpaRepository` 상속, 복잡한 쿼리는 `@Query` 사용
3. DTO - `record` + `@Builder` + Validation
4. Converter - `@UtilityClass`, `toEntity` / `to{Domain}ResDto` 메서드
5. Service - `@Transactional`, 비즈니스 로직
6. Controller - `ResponseUtils` 사용, Swagger 태그
7. Exception - `BusinessException` 상속, 도메인별 `ErrorCode`
8. Test - Given-When-Then, 한글 메서드명, Mockito

## Additional Notes

- Virtual Threads 활성화
- Actuator: 모든 엔드포인트 허용 (프로덕션에서는 제한 필요)
- DevTools: 로컬 개발 시 자동 재시작 지원
- Swagger URL: `http://localhost:8080/swagger-ui/index.html`
- 시간 관련 로직은 `TimeUtils` 유틸 클래스를 정적으로 사용한다.
- `TimeUtils` 내부 기준 시간은 `LocalDateTime.now()`이며, 별도의 `Asia/Seoul` 고정값은 쓰지 않는다.
- 현재 시각이 필요한 서비스는 `TimeUtils.nowDateTime()` 같은 정적 메서드를 직접 호출하고, `BaseResponse` 같은 공통 응답 포맷도 같은 유틸을 사용한다.
- 기준 스키마는 `Flyway`가 아니라 `src/main/resources/ddl.sql` 단일 파일로 관리
- 굿즈 생성 API는 JSON이 아니라 `multipart/form-data` 기반이며, `name`, `imageFile` 파트를 사용
- waiting 상태 변화 이벤트의 공통 payload, routing key, publisher는 `common/event/waiting` 패키지에서 관리한다.
- waiting 상태 변화 감지 공통 모듈은 `common/event/waiting` 패키지에서 관리하고, 상태가 실제로 바뀐 경우에만 이벤트 메시지를 생성한다.
- waiting 상태 변화 공통 모듈은 `ApplicationEventPublisher`와 `@TransactionalEventListener(AFTER_COMMIT)`를 사용해 내부 이벤트를 발행하고, 커밋 이후
  RabbitMQ로 전파한다.
- QR 스캔 과정에서 waiting 호출 만료(`EXPIRED`)는 별도 상태 저장 서비스에서 `REQUIRES_NEW` 트랜잭션으로 반영해, 예외 반환 때문에 상태 변경이 롤백되지 않도록 한다.
- RabbitMQ consumer는 공통 패키지가 아니라 실제 수행 도메인(`boothmanager`, `pushnotification`)에 둔다.
- `boothmanager` 도메인의 SSE consumer는 waiting 이벤트를 RabbitMQ에서 받아 `BoothManagerSseService`로 넘기고, 실제 브로드캐스트는 기존 Redis/SSE
  흐름을 그대로 사용한다.
- 상태 변화 후속 처리에서 도메인 서비스는 SSE/FCM을 직접 호출하지 않고, RabbitMQ consumer 경로만 사용한다.
- 현재 SSE 대상 waiting 이벤트는 `WAITING_CALLED`, `WAITING_REGISTERED`, `WAITING_ENTERED`, `WAITING_EXITED` 기준으로 관리한다.
- `pushnotification` 도메인의 FCM consumer는 waiting 이벤트를 RabbitMQ에서 받아 즉시 알림을 발송하고, 지연 알림이 필요한 경우 별도 delay queue에 작업 메시지를
  등록한 뒤 만료 시점에 다시 소비한다.
- waiting RabbitMQ consumer는 기본적으로 3회까지 재시도하고, 재시도 후에도 실패하면 DLQ로 보내며 무한 재큐는 하지 않는다.
- payload 누락이나 잘못된 상태값처럼 재시도로 해결되지 않는 경우는 예외를 던지지 않고 warn 로그 후 skip 한다.
- delayed FCM consumer는 stale 이벤트로 인해 `NOT_FOUND`, `PUSH_NOTIFICATION_TOKEN_NOT_FOUND`,
  `PUSH_NOTIFICATION_WAITING_STATUS_MISMATCH`, `INVALID_INPUT`이 발생하면 warn 후 skip 하고, 실제 인프라성 실패만 재시도/DLQ 대상으로 본다.
- 부스 관리자 로그인/토큰 재발급 응답에는 `boothId`를 함께 포함하고, 부스 관리자 전용 내 정보 조회는 `/api/v1/auth/booth-admins/me`에서 제공한다.
- `WaitingController`의 `/booths/me/**` 계열은 JWT subject를 boothId로 직접 쓰지 않고, boothAdminId를 기준으로 실제 boothId를 조회해 사용한다.
- booth 경로를 직접 받는 수정/관리 API는 부스 관리자 권한일 때 요청 `boothId`가 본인 소속 부스와 일치하는지 검증하고, event admin만 예외적으로 다른 부스 경로에 접근할 수 있다.

## Secrets Rule

- `.env`, `.env.local`, `.env.live` 등 환경변수 파일은 사용자가 명시적으로 읽기/수정을 요청한 경우에만 접근한다.
- AI Code Assistant는 비밀키, 액세스 키, 토큰, 비밀번호가 들어 있을 가능성이 있는 파일을 기본적으로 열지 않는다.
- 설정이 필요할 때는 우선 파일 내용을 보지 않고 필요한 키 이름만 안내하거나, 사용자의 명시적 승인 후에만 확인한다.
