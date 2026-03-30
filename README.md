# Freeline

Freeline은 행사 운영, 부스 대기열 관리, 방문자 모바일 이용, 사후 리포트 분석을 지원하는 이벤트 관리 시스템입니다.

## 제출 문서

제출용 산출물은 `exec/` 폴더에 정리되어 있습니다.

- [`exec/01.포팅_메뉴얼.md`](exec/01.포팅_메뉴얼.md)
- [`exec/02.외부_서비스_정보.md`](exec/02.외부_서비스_정보.md)
- [`exec/03.freeline_db_dump_2026-03-30.dump`](exec/03.freeline_db_dump_2026-03-30.dump)
- [`exec/04.시연_시나리오.md`](exec/04.시연_시나리오.md)
- [`exec/README.md`](exec/README.md)

## 저장소 구조

- `be/Freeline/`: Spring Boot 백엔드
- `fe/freeline-user/`: Expo 기반 사용자 앱
- `fe/freeline-booth/`: 부스 관리자 웹
- `fe/freeline-super/`: 행사 관리자 웹
- `infra/`: Docker Compose, Nginx, Jenkins, Hadoop, 모니터링
- `ai/vision-server/`: 부스맵 분석용 AI 비전 서버

## 참고 문서

- `LOCAL_DEV.md`: 로컬 개발 환경 가이드
- `infra/README.md`: 인프라 구성 개요
- `infra/loadtest/README.md`: 시연/부하테스트 실행 가이드
- `infra/hadoop/README.md`: 리포트 분석 파이프라인 설명

## 비고

- Jenkins 파일은 저장소에 유지되어 있습니다.
- 제출용 핵심 확인은 `exec/` 폴더 기준으로 보면 됩니다.
