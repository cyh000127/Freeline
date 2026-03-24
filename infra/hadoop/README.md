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
