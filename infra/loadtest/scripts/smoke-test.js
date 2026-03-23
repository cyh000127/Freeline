import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://j14a207.p.ssafy.io';

export default function () {
  const res = http.get(`${BASE_URL}/api/v3/api-docs`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
