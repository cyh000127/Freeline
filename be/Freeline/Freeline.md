# Freeline.md

This file provides guidance to AI Code Assistants when working with code in this repository.

## Project Overview

**Freeline** - Spring Boot 기반 백엔드 애플리케이션

- Java 21, Gradle 빌드 시스템
- PostgreSQL (Docker)
- Redis (Docker), Spring Security, OAuth2, WebSocket 지원
- Swagger UI (SpringDoc OpenAPI)

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

**로컬 Docker 실행:**

```bash
# PostgreSQL + Redis 컨테이너 실행
docker-compose up -d
```

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
│   ├── entity/               # BaseEntity (생성/수정 시각)
│   ├── error/                # 예외 처리
│   │   ├── ErrorCode.java   # 에러 코드 enum (도메인별 prefix)
│   │   ├── exception/
│   │   │   ├── BusinessException.java
│   │   │   └── handler/GlobalExceptionHandler.java
│   ├── response/             # 응답 포맷
│   │   ├── BaseResponse.java
│   │   ├── ErrorResponse.java
│   │   └── PageResponse.java
│   └── util/                 # 유틸리티
│       ├── LoggingUtils.java
│       └── ResponseUtils.java
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
    ...
  },
  "error": null,
  "timestamp": "2025-01-19 12:34:56"
}
```

**에러 응답:**

- `GlobalExceptionHandler`가 모든 예외를 `BaseResponse.fail(ErrorResponse)`로 변환
- `ErrorCode` enum의 도메인별 prefix (C-xxx: Common, M-xxx: Member 등)
- `BusinessException`을 상속한 도메인별 예외 클래스 사용

## Entity 규칙

- **BaseEntity 상속**: 모든 엔티티는 `BaseEntity`를 상속하여 `createdAt`, `updatedAt` 자동 관리
- **Lombok 어노테이션**: `@Builder`, `@NoArgsConstructor(access = PROTECTED)`, `@AllArgsConstructor(access = PROTECTED)`
- **수정 메서드**: `update*()` 네이밍, 매개변수에 `final` 키워드 필수
- **DTO ↔ Entity 변환**: 정적 팩토리 메서드 대신 Converter 클래스 사용

```java
public void updateName(final String name) {
    this.name = name;
}
```

## DTO 규칙

- `record` 클래스 사용 (불변 객체)
- 네이밍: `*ReqDto`, `*ResDto`
- Validation: `@NotNull`, `@NotBlank`, `@Email` 등
- `@Builder` 어노테이션 필수

```java

@Builder
public record MemberCreateReqDto(
        @NotBlank(message = "이름은 필수입니다")
        String name,

        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "이메일 형식이 올바르지 않습니다")
        String email
) {
}
```

## Converter 패턴

- `@UtilityClass` (Lombok) 사용
- 비 static 메서드
- Entity ↔ DTO 변환 담당

**네이밍 규칙:**

- DTO → Entity: `toEntity(final XxxReqDto dto)`
- Entity → DTO: `toXxxResDto(final Entity entity)`

```java

@UtilityClass
public class MemberConverter {
    public Member toEntity(final MemberCreateReqDto dto) {
        return Member.builder()
                .name(dto.name())
                .email(dto.email())
                .build();
    }

    public MemberResDto toMemberResDto(final Member entity) {
        return MemberResDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .email(entity.getEmail())
                .build();
    }
}
```

## Validation 계층 분리

**2단계 검증 전략:**

**1단계: DTO Validation (`@Valid`)**

- 위치: Controller 진입 시점
- 역할: null 체크, 길이, 패턴, 타입 등 형식 검증
- 도구: Jakarta Validation (`@NotNull`, `@NotBlank`, `@Email` 등)

**2단계: Business Validation**

- 위치: Service 내부
- 역할: DB 조회가 필요한 비즈니스 규칙 검증
- 도구: Repository 조회 + `BusinessException` 발생

```java

@Service
@Transactional
public class MemberService {
    private final MemberRepository memberRepository;

    public Member create(final MemberCreateReqDto dto) {
        if (memberRepository.existsByEmail(dto.email())) {
            throw new MemberException(ErrorCode.MEMBER_EMAIL_DUPLICATE);
        }
        Member member = MemberConverter.toEntity(dto);
        return memberRepository.save(member);
    }
}
```

> 별도의 Validator 클래스는 만들지 않음

## 메서드 매개변수 규칙

모든 메서드 매개변수에 `final` 키워드 필수

```java
public Member findById(final Long id) { ...}

public void update(final Long id, final String name) { ...}
```

## Code Style

**Import 규칙:**

- wildcard import 금지`r`n- static import 금지`r`n- 정렬 순서: `java` → `javax` → `jakarta` → `org` → `lombok` → `com`
- import 그룹 사이에는 빈 줄 1줄만 허용
- `import static org...` 는 `org` 그룹에 포함되므로 같은 블록에서 관리`r`n- 체크스타일 규칙이 문서형 코드스타일보다 우선하며, 모든 Java 코드는 `checkstyleMain`, `checkstyleTest`를 통과해야 완료로 간주`
- AI Code Assistant는 Java 파일을 수정한 경우 응답 전 체크스타일까지 확인하고, import 순서와 그룹 분리까지 정확히 맞춰서 작성

**코딩 원칙:**

- DRY (Don't Repeat Yourself)
- SOLID 원칙
- 객체 지향적 설계

## Controller 규칙

```java

@Tag(name = "Member", description = "회원 관리 API")
@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @Operation(summary = "회원 생성")
    @PostMapping
    public ResponseEntity<BaseResponse<MemberResDto>> createMember(
            @Valid @RequestBody final MemberCreateReqDto request
    ) {
        MemberResDto response = memberService.createMember(request);
        return ResponseUtils.created(response);
    }

    @Operation(summary = "회원 조회")
    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<MemberResDto>> getMember(
            @PathVariable final Long id
    ) {
        MemberResDto response = memberService.getMember(id);
        return ResponseUtils.ok(response);
    }
}
```

**규칙:**

- `@ApiResponse` 사용 안 함
- `ResponseUtils` 필수 사용
- Swagger 태그: 도메인별 `@Tag(name = "...")`
- API base path는 `/api/v1/{domain}` 형식으로 시작
- 도메인 컨트롤러의 하위 경로는 자신의 도메인 세그먼트 뒤에서만 확장
- 다른 도메인 식별자가 필요해도 경로 시작은 현재 도메인으로 고정
- 예시: Booth `/api/v1/booths/events/{eventId}`, BoothMap `/api/v1/boothmaps/events/{eventId}`, Goods
  `/api/v1/goods/booths/{boothId}`, EventAdmin `/api/v1/event-admins`

## Transaction Management

- `@Transactional`은 Service 레이어에만 사용 (Controller, Repository 금지)
- 읽기 전용 메서드: `@Transactional(readOnly = true)`
- 기본 전파 속성: `Propagation.REQUIRED`
- `RuntimeException` 및 하위 예외: 자동 롤백

## Exception Handling

**도메인별 Exception 생성:**

```java
public class MemberException extends BusinessException {
    public MemberException(ErrorCode errorCode) {
        super(errorCode);
    }
}
```

**ErrorCode 네이밍 컨벤션:**

- Common: `C-xxx`
- Member: `M-xxx`
- (도메인명 첫 글자 대문자-숫자 3자리)

```java
MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "M-001","회원을 찾을 수 없습니다."),

MEMBER_EMAIL_DUPLICATE(HttpStatus.CONFLICT, "M-002","이미 존재하는 이메일입니다."),
```

## Database

**JPA 설정:**

- `spring.jpa.open-in-view: false` (OSIV 비활성화)
- JPA Auditing 활성화 (BaseEntity 자동 시각 관리)
- 기준 스키마는 `src/main/resources/ddl.sql`로 관리
- 기본 JPA 설정은 `ddl-auto: none`이며, 필요할 때만 `JPA_DDL_AUTO` 환경변수로 `validate` 또는 `update`를 지정
- 기존 DB 위에서 실행할 때는 엔티티-스키마 불일치로 부팅이 막히지 않도록 자동 검증을 기본 비활성화

**로컬 환경 DB:**

- PostgreSQL과 Redis 모두 Docker로 실행
- H2 in-memory DB 사용 안 함

**Repository 규칙:**

- `JpaRepository` 상속
- 복잡한 쿼리: `@Query` 어노테이션 (QueryDSL 사용 안 함)
- 커스텀 Repository 필요 시: `{Domain}RepositoryCustom` (인터페이스) + `{Domain}RepositoryImpl` (구현체)

**페이징 처리:**

- `Page<T>` 또는 `Slice<T>` 사용
- 응답 시 `PageResponse<T>`로 변환

## Logging Strategy

**로그 형식:**

```
[Domain] 행위 완료 {key: value}
```

**예시:**

```java
log.info("[Member] 생성 완료 {id: {}, email: {}}",member.getId(),member.

getEmail());
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

**테스트 분류:**

- 단위 테스트: `*ServiceTest.java` (Mockito)
- 통합 테스트: `*IntegrationTest.java` (`@SpringBootTest`)

```java

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private MemberService memberService;

    @Test
    void 회원_생성_성공() {
        // given
        MemberCreateReqDto request = MemberCreateReqDto.builder()
                .name("홍길동")
                .email("hong@example.com")
                .build();

        Member member = Member.builder()
                .name("홍길동")
                .email("hong@example.com")
                .build();

        when(memberRepository.save(any(Member.class))).thenReturn(member);

        // when
        MemberResDto result = memberService.createMember(request);

        // then
        assertThat(result.name()).isEqualTo("홍길동");
        verify(memberRepository).save(any(Member.class));
    }
}
```

## Security Configuration

- **현재 상태**: 인증 미구현 (모든 요청 `permitAll()`)
- Stateless 세션: `SessionCreationPolicy.STATELESS`
- CORS: `CorsConfig`에서 허용 도메인 관리
- 비활성화: CSRF, HTTP Basic, Form Login

## Swagger/OpenAPI

- URL: `http://localhost:8080/swagger-ui/index.html`
- API 문서 자동 생성

## 새 도메인 추가 체크리스트

1. **Entity** - `BaseEntity` 상속, `@Builder`, `final` 매개변수
2. **Repository** - `JpaRepository` 상속, 복잡한 쿼리는 `@Query` 사용
3. **DTO** - `record` + `@Builder` + Validation
4. **Converter** - `@UtilityClass`, `toEntity` / `to{Domain}ResDto` 메서드
5. **Service** - `@Transactional`, 비즈니스 로직
6. **Controller** - `ResponseUtils` 사용, Swagger 태그
7. **Exception** - `BusinessException` 상속, 도메인별 `ErrorCode` (`X-xxx`)
8. **Test** - Given-When-Then, 한글 메서드명, Mockito

## Additional Notes

- Virtual Threads 활성화
- Actuator: 모든 엔드포인트 허용 (프로덕션에서는 제한 필요)
- DevTools: 로컬 개발 시 자동 재시작 지원
- Swagger URL: `http://localhost:8080/swagger-ui/index.html`
