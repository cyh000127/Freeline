# Super Frontend Jira Ticket Drafts

작성일: 2026-03-26
대상: `fe/freeline-super`
범위: 프론트엔드만 수정

## Epic

### [FE] super 이벤트 생성/수정 폼 검증 및 메인 목록 UX 개선

#### 배경
- `super` 관리자 화면의 행사 생성/수정 모달에서 입력 제약이 백엔드와 완전히 맞지 않음
- 유효하지 않은 입력을 초과했을 때 즉시 피드백이 없어 사용성이 떨어짐
- 메인 이벤트 목록은 API가 페이지네이션을 지원하지만 화면은 명시적 페이지 전환 UI가 없음
- 모달을 닫았다가 다시 열면 이전 입력값/파일 미리보기/상태가 남는 현상이 있음

#### 완료 조건
- 행사 등록/수정 폼이 백엔드 제약과 맞는 입력 제한을 제공한다.
- 유효성 오류가 있는 필드는 회원가입 이름 입력 UX와 유사하게 빨간 강조 상태를 보여준다.
- 행사 시작일은 오늘 이전으로 선택할 수 없다.
- 메인 이벤트 목록은 10개 단위 페이지네이션 UI를 제공한다.
- 모달 재오픈 시 이전 입력 히스토리가 남지 않는다.

#### 참고 근거
- 이벤트 목록 API 기본 페이지 크기: [`be/Freeline/src/main/java/com/freeline/domain/event/controller/EventController.java`](C:/Users/SSAFY/Desktop/135/S14P21A207/be/Freeline/src/main/java/com/freeline/domain/event/controller/EventController.java)
- 이벤트명 길이 100자: [`be/Freeline/src/main/java/com/freeline/domain/event/entity/Event.java`](C:/Users/SSAFY/Desktop/135/S14P21A207/be/Freeline/src/main/java/com/freeline/domain/event/entity/Event.java)
- 주소 길이 255자: [`be/Freeline/src/main/java/com/freeline/domain/event/entity/Event.java`](C:/Users/SSAFY/Desktop/135/S14P21A207/be/Freeline/src/main/java/com/freeline/domain/event/entity/Event.java)
- 설명은 현재 `TEXT` 컬럼으로 별도 최대 길이 제한이 없음: [`be/Freeline/src/main/java/com/freeline/domain/event/entity/Event.java`](C:/Users/SSAFY/Desktop/135/S14P21A207/be/Freeline/src/main/java/com/freeline/domain/event/entity/Event.java)

---

## 추천 작업 순서

1. `[FE] super 행사 추가/수정 모달 상태 초기화 및 히스토리 잔존 문제 수정`
2. `[FE] super 행사 추가/수정 폼 입력 제한 및 에러 상태 UI 적용`
3. `[FE] super 행사 시작일 과거 선택 제한 및 날짜 유효성 검증 적용`
4. `[FE] super 이벤트 메인 목록 10개 단위 페이지네이션 적용`

---

## Ticket 1

### [FE] super 행사 추가/수정 모달 상태 초기화 및 히스토리 잔존 문제 수정

#### 설명
행사 추가/수정 모달은 닫혔다가 다시 열릴 때 이전에 입력하던 값, 파일 미리보기, 내부 오픈 상태가 유지되는 경우가 있다. 모달 오픈/클로즈 라이프사이클에 맞춰 상태를 명확히 초기화한다.

#### 작업 범위
- 생성 모달 닫힘 시 폼 상태, 파일 상태, 우편번호 모달 상태 초기화
- 수정 모달 닫힘 시 폼 상태, 정책 상태, 파일 상태, 드롭다운 상태 초기화
- 다른 이벤트를 연속 편집할 때 이전 이벤트의 비저장 값이 섞이지 않도록 처리

#### 인수 조건
- 행사 추가 모달을 닫고 다시 열면 모든 입력값이 초기 상태다.
- 행사 수정 모달을 닫고 다시 열면 직전의 비저장 변경값이 남지 않는다.
- 파일 선택 후 닫았다가 다시 열어도 이전 미리보기 이미지가 남지 않는다.
- 상태 드롭다운, 주소 검색 모달 등 내부 UI 상태도 재오픈 시 초기화된다.

#### 영향 파일
- [`fe/freeline-super/src/components/AddEventModal.tsx`](C:/Users/SSAFY/Desktop/135/S14P21A207/fe/freeline-super/src/components/AddEventModal.tsx)
- [`fe/freeline-super/src/components/EditEventModal.tsx`](C:/Users/SSAFY/Desktop/135/S14P21A207/fe/freeline-super/src/components/EditEventModal.tsx)

---

## Ticket 2

### [FE] super 행사 추가/수정 폼 입력 제한 및 에러 상태 UI 적용

#### 설명
행사 추가/수정 모달에서 문자열 입력값의 길이 제한을 프론트에서 즉시 제어한다. 백엔드 기준으로 행사명은 100자, 행사 주소는 255자에 맞춘다. 설명 필드는 현재 백엔드 최대 길이 제한이 없으므로 임의 250자 제한 문구를 제거하거나 실제 정책과 일치하는 안내 문구로 변경한다.

#### 작업 범위
- `AddEventModal`, `EditEventModal`에 문자열 길이 검증 추가
- 최대 길이 초과 시 입력창 빨간 테두리/강조 표시
- 필요 시 필드 하단에 에러 문구 또는 글자 수 카운트 표시
- 제출 버튼 비활성화 조건에 길이 초과 상태 반영

#### 인수 조건
- 행사명 100자 초과 입력 시 더 이상 입력되지 않거나 즉시 오류 상태가 보인다.
- 행사 주소 255자 초과 입력 시 더 이상 입력되지 않거나 즉시 오류 상태가 보인다.
- 길이 초과 상태의 입력창은 회원가입 이름 인풋과 같은 톤의 빨간 오류 상태를 가진다.
- 길이 오류가 해소되면 빨간 상태가 즉시 정상으로 돌아온다.
- 행사 설명 필드의 안내 문구는 백엔드 제약과 모순되지 않는다.

#### 영향 파일
- [`fe/freeline-super/src/components/AddEventModal.tsx`](C:/Users/SSAFY/Desktop/135/S14P21A207/fe/freeline-super/src/components/AddEventModal.tsx)
- [`fe/freeline-super/src/components/EditEventModal.tsx`](C:/Users/SSAFY/Desktop/135/S14P21A207/fe/freeline-super/src/components/EditEventModal.tsx)
- [`fe/freeline-super/src/app/register/page.tsx`](C:/Users/SSAFY/Desktop/135/S14P21A207/fe/freeline-super/src/app/register/page.tsx)

---

## Ticket 3

### [FE] super 행사 시작일 과거 선택 제한 및 날짜 유효성 검증 적용

#### 설명
행사 등록/수정 모달에서 시작일은 오늘 이전 날짜를 선택할 수 없도록 막는다. 날짜 입력이 유효하지 않은 경우 즉시 시각적 피드백을 보여주고 제출을 막는다.

#### 작업 범위
- 시작일 입력에 오늘 날짜 기준 최소값 적용
- 필요 시 종료일 최소값을 시작일 이상으로 동기화
- 날짜 유효성 오류 시 빨간 강조 상태 적용
- 제출 가능 여부에 날짜 유효성 포함

#### 인수 조건
- 행사 시작일은 오늘 이전 날짜를 브라우저 UI에서 선택할 수 없다.
- 직접 입력 또는 비정상 상태로 오늘 이전 날짜가 들어간 경우 오류 상태가 보이고 제출되지 않는다.
- 종료일이 시작일보다 빠른 경우에도 오류 상태가 보이고 제출되지 않는다.
- 생성 모달과 수정 모달 모두 동일하게 동작한다.

#### 영향 파일
- [`fe/freeline-super/src/components/AddEventModal.tsx`](C:/Users/SSAFY/Desktop/135/S14P21A207/fe/freeline-super/src/components/AddEventModal.tsx)
- [`fe/freeline-super/src/components/EditEventModal.tsx`](C:/Users/SSAFY/Desktop/135/S14P21A207/fe/freeline-super/src/components/EditEventModal.tsx)

---

## Ticket 4

### [FE] super 이벤트 메인 목록 10개 단위 페이지네이션 적용

#### 설명
이벤트 메인 화면은 현재 첫 페이지 데이터를 받아 카드로 렌더링하지만, 페이지 전환 UI가 없어 전체 이벤트 탐색이 어렵다. 백엔드 목록 API의 `page`, `size`, `totalPages`를 사용해 10개 단위 페이지네이션을 구현한다.

#### 작업 범위
- 메인 목록 조회 시 현재 페이지 상태 관리
- 페이지 이동 버튼 또는 페이지 번호 UI 추가
- 페이지 전환 시 목록 재조회
- 이벤트 추가/삭제/수정 후 현재 페이지 상태를 기준으로 새로고침

#### 인수 조건
- 이벤트 메인 화면에서 한 페이지에 최대 10개 이벤트 카드만 노출된다.
- 다음/이전 또는 페이지 번호 클릭 시 해당 페이지의 데이터가 표시된다.
- 첫 페이지/마지막 페이지에서는 이동 불가 버튼 상태가 명확하다.
- 이벤트를 추가/수정/삭제한 뒤에도 페이지 상태가 깨지지 않는다.

#### 영향 파일
- [`fe/freeline-super/src/app/page.tsx`](C:/Users/SSAFY/Desktop/135/S14P21A207/fe/freeline-super/src/app/page.tsx)
- [`fe/freeline-super/src/lib/api/event.ts`](C:/Users/SSAFY/Desktop/135/S14P21A207/fe/freeline-super/src/lib/api/event.ts)

---

## 메모

- 현재 수정 API DTO에는 `description` 필드가 있으나, 엔티티 `update()` 메서드는 설명을 갱신하지 않는다. 이 문서는 프론트 작업 기준으로 작성했고, 설명 수정 저장이 필요하면 별도 백엔드 티켓 분리가 안전하다.
