# DB 초기화 시 Hadoop/Hive 정리 Runbook

이 문서는 `freeline` 운영/개발 환경에서 **DB 초기화(밀기)** 작업 시
HDFS/Hive 데이터를 어떻게 정리해야 하는지 표준 절차를 정의합니다.

## 왜 필요한가

- 앱 DB는 초기화됐는데 HDFS 로그/덤프가 남아 있으면, 리포트 생성 시 과거 데이터가 섞일 수 있습니다.
- 특히 DB 시퀀스까지 리셋되어 `event_id`가 재사용되면 오염 가능성이 큽니다.

## 적용 기준

### 1) 부분 초기화 (권장: 하둡 전체 정리 불필요)
- 특정 이벤트/테이블 일부만 정리
- DB 시퀀스 유지
- 경우에 따라 해당 이벤트 결과만 삭제

### 2) 전체 초기화 (권장: 하둡/하이브도 같이 정리)
- DB를 완전히 재생성/초기화
- ID 시퀀스 재시작 가능
- 아래 전체 정리 절차 수행 권장

## 관련 경로/구성

- HDFS 기본 경로: `/data`
- 앱 행동 로그: `/data/logs/action`
- DB 덤프 파일: `/data/db_dump`
- 리포트 결과 파일: `/data/reports`
- Hive 초기화 스크립트: `infra/hadoop/scripts/init-hive.sql`
- HDFS 초기화 스크립트: `infra/hadoop/scripts/init-hdfs.sh`

---

## 전체 정리 표준 절차

### 0. 사전 주의

- 아래 명령은 삭제 작업을 포함합니다. 운영 환경에서는 백업/승인 후 수행하세요.
- 기본적으로 인프라 컨테이너가 이미 떠 있다고 가정합니다.

### 1. 유입 중지

```bash
docker compose -f infra/backend/docker-compose.yml stop freeline-backend
docker compose -f infra/flume-agent/docker-compose.yml stop flume-agent flume-spool-mover
```

### 2. HDFS 데이터 삭제

```bash
docker exec hadoop-namenode hdfs dfs -rm -r -skipTrash /data/logs/action/*
docker exec hadoop-namenode hdfs dfs -rm -r -skipTrash /data/db_dump/*
docker exec hadoop-namenode hdfs dfs -rm -r -skipTrash /data/reports/*
```

삭제 대상:
- 원천 행동 로그
- 리포트 생성용 DB 덤프 파일
- 분석 산출물 저장 경로

### 3. Hive 결과 테이블 비우기

```bash
docker exec hive-server beeline -u jdbc:hive2://localhost:10000 -e "
USE freeline;
TRUNCATE TABLE booth_performance_result;
TRUNCATE TABLE hourly_traffic_result;
TRUNCATE TABLE visitor_path_result;
TRUNCATE TABLE problem_spots_result;
TRUNCATE TABLE event_summary_result;
"
```

참고:
- 외부 테이블(`action_logs`, `*_dump`)은 HDFS 경로를 보기 때문에,
  2단계에서 HDFS를 비우면 사실상 데이터도 비워진 상태입니다.
- 위 `TRUNCATE`는 내부 결과 테이블을 명시적으로 초기화하기 위한 절차입니다.

### 4. 기본 디렉토리 재생성(필요 시)

```bash
docker exec hadoop-namenode bash /scripts/init-hdfs.sh
```

### 5. 서비스 재기동

```bash
docker compose -f infra/backend/docker-compose.yml start freeline-backend
docker compose -f infra/flume-agent/docker-compose.yml start flume-agent flume-spool-mover
```

---

## 사후 검증 체크리스트

### HDFS

```bash
docker exec hadoop-namenode hdfs dfs -ls -R /data
```

확인 포인트:
- `/data/logs/action` 하위에 과거 로그 파일이 비워졌는지
- `/data/db_dump` 하위에 `event_*.tsv`가 삭제됐는지

### Hive

```bash
docker exec hive-server beeline -u jdbc:hive2://localhost:10000 -e "
USE freeline;
SELECT COUNT(*) AS c FROM booth_performance_result;
SELECT COUNT(*) AS c FROM hourly_traffic_result;
SELECT COUNT(*) AS c FROM visitor_path_result;
SELECT COUNT(*) AS c FROM problem_spots_result;
SELECT COUNT(*) AS c FROM event_summary_result;
"
```

확인 포인트:
- 결과 테이블 카운트가 0인지

---

## 부분 정리 예시 (특정 이벤트만 제거)

예: `event_id = 12`만 제거할 때

1. HDFS 덤프 파일 삭제:

```bash
docker exec hadoop-namenode hdfs dfs -rm -f /data/db_dump/booths/event_12.tsv
docker exec hadoop-namenode hdfs dfs -rm -f /data/db_dump/visitors/event_12.tsv
docker exec hadoop-namenode hdfs dfs -rm -f /data/db_dump/booth_waiting/event_12.tsv
docker exec hadoop-namenode hdfs dfs -rm -f /data/db_dump/booth_goods/event_12.tsv
```

2. 앱 DB 결과 테이블(backend PostgreSQL)에서 이벤트별 결과 삭제:
- `event_summary_results`
- `booth_performance_results`
- `hourly_traffic_results`
- `visitor_path_results`
- `problem_spot_results`

(삭제 SQL은 운영 정책에 맞게 별도 승인 후 실행)

---

## 운영 권장 사항

- 정기적으로 `/data/logs/action` 보관 주기를 운영 규칙으로 관리하세요.
- DB 전체 초기화 작업에는 이 Runbook 수행 여부를 체크리스트에 포함하세요.
- 리포트 이상치가 보이면 우선 `event_id` 충돌 여부와 HDFS 잔존 데이터를 점검하세요.
