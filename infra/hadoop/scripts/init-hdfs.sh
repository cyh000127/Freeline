#!/bin/bash
# HDFS 디렉토리 초기 생성 스크립트
# Usage: docker exec hadoop-namenode bash /scripts/init-hdfs.sh

set -euo pipefail

HDFS="hdfs dfs"

echo "=== HDFS 디렉토리 초기화 ==="

# 행동 로그 (Flume → HDFS)
$HDFS -mkdir -p /data/logs/action
echo "  /data/logs/action"

# DB 덤프 (행사 종료 후 적재)
$HDFS -mkdir -p /data/db_dump
echo "  /data/db_dump"

# 분석 결과 (Hive 쿼리 출력)
$HDFS -mkdir -p /data/reports
echo "  /data/reports"

# Hive warehouse
$HDFS -mkdir -p /user/hive/warehouse
echo "  /user/hive/warehouse"

# 권한 설정
$HDFS -chmod -R 777 /data
$HDFS -chmod -R 777 /user/hive

echo "=== 완료 ==="
$HDFS -ls -R /data
