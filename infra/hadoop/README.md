# Hadoop Analytics Pipeline

행사별 사후 분석 리포트를 위한 Hadoop 배치 분석 파이프라인.

## 아키텍처

```
[Server A - 앱 서버]
  Spring Boot → Logback 시간별 롤링 → logs/action/action.YYYY-MM-DD-HH.log
      ↓ (named volume: freeline-action-logs)
  flume-spool-mover → 롤링 완료 파일을 spool/ 디렉토리로 이동
      ↓ (named volume: flume-spool)
  flume-agent → spooldir source → memory channel → HDFS sink

[Server B - 인프라 서버]
  HDFS (NameNode + DataNode)
  YARN (ResourceManager + NodeManager)
  Hive (Metastore + HiveServer2)
```

## Hadoop에 적재되는 로그 범위

Hadoop/HDFS로 적재되는 것은 전체 애플리케이션 로그가 아니라 모바일 앱 행동 로그만이다.

- 모바일 앱이 `POST /api/v1/logs/actions`로 전송한 벌크 행동 로그만 적재된다.
- 백엔드는 이 요청을 `ACTION_LOG` 전용 파일 appender에 TSV 한 줄씩 기록한다.
- Flume은 이 전용 action log 파일의 시간별 롤링 결과만 읽어 HDFS로 적재한다.
- 일반 Spring Boot 애플리케이션 로그, 콘솔 로그, 에러 로그, Booth/Super 웹앱 로그는 이 파이프라인 대상이 아니다.

행동 로그 한 줄에는 아래 값이 순서대로 저장된다.

```text
eventId, visitorId, action, targetType, targetId, metadata, clientTimestamp, sessionId
```

## flume-spool-mover 역할

`flume-spool-mover`는 백엔드 원본 로그 볼륨과 Flume `spooldir` 사이의 중계 컨테이너다.

- 원본 로그 위치: `/var/log/action/source`
- Flume 입력 위치: `/var/log/action/spool`
- 60초마다 원본 로그 디렉토리를 확인한다.
- `action.YYYY-MM-DD-HH.log` 패턴의 롤링 파일만 이동한다.
- `-mmin +5` 조건으로 5분 이상 수정되지 않은 파일만 옮겨, 아직 쓰는 중인 파일을 제외한다.
- 현재 쓰기 중인 `action.log`는 직접 옮기지 않는다.

이 분리가 필요한 이유는 Flume `spooldir` source가 "이미 완전히 닫혀 더 이상 변경되지 않는 파일"을 안정적으로 처리하는 용도이기 때문이다.

## 현재 적재되는 행동 로그 종류

현재 모바일 앱 코드 기준으로 HDFS에 적재되는 액션은 아래와 같다.

| action | 의미 | 대표 예시 |
|--------|------|-----------|
| `APP_OPEN` | 앱 포그라운드 진입 | 앱 실행 후 첫 진입 |
| `PAGE_VIEW` | 페이지 진입 | `home`, `map`, `reservations`, `my`, `search`, `qr-scan`, `booth-detail`, `goods` |
| `BOOTH_VIEW` | 부스 상세 조회 | 부스 상세 정보 조회 |
| `WAITING_REGISTER` | 대기 등록 | 부스 대기 등록 완료 |
| `WAITING_CANCEL` | 대기 취소 | 예약 취소 |
| `WAITING_COMPLETE` | 호출 응답 완료 | 체험 입장 처리 |
| `GOODS_VIEW` | 굿즈 목록 조회 | 굿즈 목록 버튼 클릭 또는 굿즈 페이지 진입 |
| `MAP_INTERACTION` | 지도 관련 상호작용 | 부스 시트 열기, 검색 결과 선택, 순서 미루기, QR 스캔 |

참고:

- `PUSH_CLICK` 타입은 정의돼 있지만 현재 모바일 앱에서 실제 전송 코드는 없어, 지금 기준으로는 HDFS에 적재되지 않는다.
- `metadata`에는 액션별 세부 정보가 들어간다. 예: `booth_name`, `location_code`, `waiting_id`, `interaction`, `query`, `goods_count`

## 컴포넌트

| 컨테이너 | 이미지 | 포트 | 역할 |
|----------|--------|------|------|
| hadoop-namenode | apache/hadoop:3.4.1 | 9870 (Web UI) | HDFS NameNode |
| hadoop-datanode | apache/hadoop:3.4.1 | - | HDFS DataNode |
| hadoop-resourcemanager | apache/hadoop:3.4.1 | 8088 (Web UI) | YARN ResourceManager |
| hadoop-nodemanager | apache/hadoop:3.4.1 | - | YARN NodeManager |
| hive-metastore-db | postgres:18.3-alpine | - | Hive Metastore DB |
| hive-metastore | apache/hive:4.0.1 | 9083 | Hive Metastore (Thrift) |
| hive-server | apache/hive:4.0.1 | 10000, 10002 (Web UI) | HiveServer2 (JDBC) |
| flume-agent | custom (Flume 1.11.0) | - | 로그 수집 → HDFS |
| flume-spool-mover | alpine:3.21 | - | 롤링 파일 spool 이동 |

## 초기 설정

Hadoop 클러스터가 처음 올라간 후 **1회** 실행:

```bash
# 1. HDFS 디렉토리 생성
docker exec hadoop-namenode bash /scripts/init-hdfs.sh

# 2. Hive 테이블 생성
docker exec hive-server beeline -u jdbc:hive2://localhost:10000 -f /scripts/init-hive.sql
```

## HDFS 디렉토리 구조

```
/data/
├── logs/
│   └── action/          # Flume이 적재하는 행동 로그 (시간별 파티션)
│       └── YYYY-MM-DD/
│           └── HH/
├── db_dump/             # 행사 종료 후 DB 덤프
│   ├── booth_waiting/
│   ├── booths/
│   ├── visitors/
│   └── booth_goods/
└── reports/             # 분석 결과 출력

/user/hive/warehouse/    # Hive managed 테이블
```

## Hive 테이블

| 테이블 | 소스 | 설명 |
|--------|------|------|
| `freeline.action_logs` | Flume → HDFS | 모바일 앱 행동 로그 (TSV) |
| `freeline.booth_waiting_dump` | DB 덤프 | 대기열 상태 변경 이력 |
| `freeline.booths_dump` | DB 덤프 | 부스 정보 |
| `freeline.visitors_dump` | DB 덤프 | 방문자 정보 |
| `freeline.booth_goods_dump` | DB 덤프 | 부스 상품 정보 |

## 운영 명령어

### HDFS

```bash
# 파일 목록 확인
docker exec hadoop-namenode hdfs dfs -ls -R /data/logs/action

# 저장 용량 확인
docker exec hadoop-namenode hdfs dfs -du -s -h /data

# 오래된 로그 삭제 (예: 30일 이전)
docker exec hadoop-namenode hdfs dfs -rm -r /data/logs/action/2026-02-*
```

### Hive

```bash
# beeline 접속
docker exec -it hive-server beeline -u jdbc:hive2://localhost:10000

# 쿼리 예시: 부스별 조회수
docker exec hive-server beeline -u jdbc:hive2://localhost:10000 -e "
  USE freeline;
  SELECT target_id AS booth_id, COUNT(*) AS views
  FROM action_logs
  WHERE action = 'BOOTH_VIEW'
  GROUP BY target_id
  ORDER BY views DESC
  LIMIT 10;
"
```

### Flume

```bash
# Flume 로그 확인
docker logs flume-agent --tail 50

# spool 디렉토리 상태 확인
docker exec flume-spool-mover ls -la /var/log/action/spool/
```

### DB 덤프 → HDFS 적재

행사 종료 후 PostgreSQL 데이터를 HDFS로 적재:

```bash
# Server A에서 실행
# 1. DB 덤프 (TSV)
docker exec freeline-db psql -U ${DB_USERNAME} -d ${DB_NAME} -c \
  "COPY (SELECT * FROM booth_waiting WHERE booth_id IN (SELECT id FROM booths WHERE event_id = {EVENT_ID})) TO STDOUT WITH (FORMAT text)" \
  > /tmp/booth_waiting.tsv

# 2. HDFS 업로드
docker cp /tmp/booth_waiting.tsv hadoop-namenode:/tmp/
docker exec hadoop-namenode hdfs dfs -mkdir -p /data/db_dump/booth_waiting
docker exec hadoop-namenode hdfs dfs -put /tmp/booth_waiting.tsv /data/db_dump/booth_waiting/
```

## 설정 파일

| 파일 | 설명 |
|------|------|
| `config/core-site.xml` | HDFS 기본 설정 (fs.defaultFS) |
| `config/hdfs-site.xml` | HDFS 복제 수(1), 디렉토리 경로, 권한 비활성화 |
| `config/mapred-site.xml` | MapReduce → YARN 프레임워크 |
| `config/yarn-site.xml` | YARN NodeManager 메모리(2GB), vMem 체크 비활성화 |
| `scripts/init-hdfs.sh` | HDFS 디렉토리 초기화 (최초 1회) |
| `scripts/init-hive.sql` | Hive 외부 테이블 생성 (최초 1회) |
