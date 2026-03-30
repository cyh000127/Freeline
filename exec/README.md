# Freeline 제출 산출물

`exec/` 폴더에는 포팅 및 시연 제출용 산출물을 정리했다.

## 필수 제출물

1. [`01.포팅_메뉴얼.md`](01.포팅_메뉴얼.md)
   - GitLab 소스 클론 이후 빌드/배포 절차
   - 사용 제품/버전(JVM, WAS, Node, DB, 메시지 브로커 등)
   - 환경변수 목록
   - 배포 시 특이사항
2. [`02.외부_서비스_정보.md`](02.외부_서비스_정보.md)
   - 프로젝트 연동 외부 서비스 및 외부 의존 시스템 정리
3. [`03.freeline_db_dump_2026-03-30.dump`](03.freeline_db_dump_2026-03-30.dump)
   - 2026-03-30 기준 PostgreSQL 최신 덤프 파일
   - PostgreSQL custom format(`pg_dump -Fc`)
4. [`04.시연_시나리오.md`](04.시연_시나리오.md)
   - 발표/평가용 시연 흐름과 사전 준비 절차
## 추가 파일

- [`03.freeline_db_dump_2026-03-30.sha256`](03.freeline_db_dump_2026-03-30.sha256)
  - DB 덤프 무결성 체크섬

## DB 덤프 메모

- 파일명: `03.freeline_db_dump_2026-03-30.dump`
- 형식: PostgreSQL custom format
- 크기: 약 `330K`
- SHA-256: `fa2c48906f7b03d3843cf0a9f69ebaabf49ddc3ed0d3d46fa68b22e048b8e641`

## 복원 예시

```bash
docker cp exec/03.freeline_db_dump_2026-03-30.dump freeline-db:/tmp/
docker exec freeline-db sh -lc '
  dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB" &&
  createdb -U "$POSTGRES_USER" "$POSTGRES_DB" &&
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /tmp/03.freeline_db_dump_2026-03-30.dump
'
```
