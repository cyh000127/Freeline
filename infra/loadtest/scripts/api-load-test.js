import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  scenarios: {
    browse_events: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://j14a207.p.ssafy.io';

export default function () {
  group('API Health', () => {
    const health = http.get(`${BASE_URL}/api/v3/api-docs`);
    check(health, { 'api-docs 200': (r) => r.status === 200 });
  });

  group('Event Listing', () => {
    const events = http.get(`${BASE_URL}/api/v1/events`);
    check(events, { 'events reachable': (r) => r.status < 500 });
  });

  sleep(Math.random() * 3 + 1);
}
