# k6 부하 테스트

Grafana k6 기반 부하 테스트 환경. Prometheus remote write로 메트릭을 수집하고 Grafana 대시보드에서 실시간 확인 가능.

## 왜 k6인가

- Grafana Labs 제품 → Prometheus/Grafana와 네이티브 연동
- 별도 exporter나 플러그인 없이 Prometheus remote write 지원
- 경량 Go 바이너리 (JMeter 대비 리소스 20분의 1)
- JavaScript 스크립트 → 프론트엔드 개발자도 쉽게 작성 가능

## 아키텍처

```
k6-manager (Server B)
    │
    │  docker exec로 on-demand 실행
    │
    ├─ --out experimental-prometheus-rw
    │       │
    │       ▼
    │  Prometheus (Server B, :9090)
    │  --web.enable-remote-write-receiver
    │       │
    │       ▼
    │  Grafana (Server B, :3000)
    │  "k6 Load Testing" 대시보드
    │
    └─ 테스트 대상: Server A (j14a207.p.ssafy.io)
```

## 사용법

### 스모크 테스트 (기본 연결 확인)

```bash
docker exec k6-manager k6 run \
  --out experimental-prometheus-rw \
  /scripts/smoke-test.js
```
- 5 VU, 2분 실행
- 임계값: P95 < 500ms, 실패율 < 1%

### API 부하 테스트

```bash
docker exec k6-manager k6 run \
  --out experimental-prometheus-rw \
  /scripts/api-load-test.js
```
- 20 VU까지 ramp-up, 5분 실행
- 주요 API 엔드포인트 대상

### 커스텀 타겟 URL

```bash
docker exec k6-manager k6 run \
  --out experimental-prometheus-rw \
  -e TARGET_URL=http://172.26.3.239:8080 \
  /scripts/smoke-test.js
```

### 결과를 JSON 파일로도 저장

```bash
docker exec k6-manager k6 run \
  --out experimental-prometheus-rw \
  --out json=/output/result.json \
  /scripts/api-load-test.js
```

## 결과 확인

Grafana → **Load Testing** 폴더 → **k6 Load Testing** 대시보드

주요 패널:
- Virtual Users / Request Rate (RPS)
- Response Time Percentiles (P50/P90/P95/P99)
- HTTP Error Rate
- 엔드포인트별 응답 시간
- 데이터 전송량

## 테스트 스크립트 작성

`scripts/` 디렉토리에 `.js` 파일 추가 후 배포하면 자동으로 k6 컨테이너에서 사용 가능.

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // ramp-up
    { duration: '3m', target: 10 },  // steady
    { duration: '1m', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://j14a207.p.ssafy.io';

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/your-endpoint`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

## 변경 이력

이 컴포넌트 추가 시 함께 수정된 파일:

| 파일 | 변경 내용 |
|------|-----------|
| `infra/hosts.conf` | `loadtest=ubuntu@172.26.15.39` (Server B 배치) |
| `infra/Jenkinsfile` | DEPLOY_ORDER에 `loadtest` 추가 |
| `infra/monitoring/docker-compose.yml` | Prometheus `--web.enable-remote-write-receiver` 플래그 추가 |
| `infra/monitoring/grafana/provisioning/dashboards/` | k6 대시보드 자동 프로비저닝 설정 추가 |

## 주의사항

- 부하 테스트는 Server B에서 실행되므로 Jenkins 빌드와 동시 실행 시 리소스 경합 가능
- 테스트 VU 수를 보수적으로 설정하여 서버 과부하 방지 권장
- 테스트 결과 JSON 파일은 `output/` 디렉토리에 저장되며, git에 포함되지 않음
