/**
 * 고도화 부하 테스트 — 실제 방문자 행동 시뮬레이션
 *
 * 시나리오:
 *   1. 방문자 인증 (entry code)
 *   2. 행사 부스 목록 조회
 *   3. 부스 상세 조회 + 굿즈 목록 확인
 *   4. 부스맵(지도) 조회
 *   5. 대기열 등록 → 대기 상태 확인 → (확률적) 미루기/취소
 *   6. 다른 부스 탐색 + 대기 등록 반복
 *   7. 대기 완료 후 exit 처리
 *   8. 행동 로그 벌크 전송
 *
 * 부하 프로파일 (ramping-vus):
 *   - Ramp-up → Sustained peak → Spike → Recovery → Ramp-down
 *
 * 환경 변수:
 *   TARGET_URL        — API 서버 (기본: https://j14a207.p.ssafy.io)
 *   ADMIN_ID / ADMIN_PW — 관리자 인증
 *   PRESET_EVENT_ID   — 사전 생성된 행사 ID
 *   PRESET_BOOTH_IDS  — 쉼표 구분 부스 ID 목록
 *   ENTRY_PREFIX      — 방문자 entry code prefix
 *   PEAK_VUS          — 최대 동시 사용자 수 (기본: 100)
 *   SPIKE_VUS         — 스파이크 동시 사용자 수 (기본: PEAK_VUS × 2)
 *   TEST_DURATION     — 지속 구간 시간 (기본: "3m")
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Trend, Rate } from "k6/metrics";
import { SharedArray } from "k6/data";

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = __ENV.TARGET_URL || "https://j14a207.p.ssafy.io";
const ADMIN_ID = __ENV.ADMIN_ID || "";
const ADMIN_PW = __ENV.ADMIN_PW || "";
const PRESET_EVENT_ID = __ENV.PRESET_EVENT_ID || "";
const PRESET_BOOTH_IDS = __ENV.PRESET_BOOTH_IDS || "";
const PEAK_VUS = parseInt(__ENV.PEAK_VUS || "100", 10);
const SPIKE_VUS = parseInt(__ENV.SPIKE_VUS || String(PEAK_VUS * 2), 10);
const TEST_DURATION = __ENV.TEST_DURATION || "3m";

// ─── Entry Codes (SharedArray — 모든 VU가 메모리 공유) ───────────────────────

const ENTRY_CODES_FILE = __ENV.ENTRY_CODES_FILE || "/scripts/entry_codes.json";
const entryCodes = new SharedArray("entryCodes", function () {
  return JSON.parse(open(ENTRY_CODES_FILE));
});

// ─── Custom Metrics ──────────────────────────────────────────────────────────

const authSuccess = new Rate("auth_success_rate");
const boothListDuration = new Trend("booth_list_duration");
const boothDetailDuration = new Trend("booth_detail_duration");
const goodsListDuration = new Trend("goods_list_duration");
const mapViewDuration = new Trend("map_view_duration");
const waitingCreateDuration = new Trend("waiting_create_duration");
const waitingStatusDuration = new Trend("waiting_status_duration");
const actionLogDuration = new Trend("action_log_duration");

const waitingsCreated = new Counter("waitings_created");
const waitingsCancelled = new Counter("waitings_cancelled");
const waitingsPostponed = new Counter("waitings_postponed");
const waitingsExited = new Counter("waitings_exited");
const actionLogsSent = new Counter("action_logs_sent");
const boothsViewed = new Counter("booths_viewed");

// ─── Options ─────────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    stress_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: Math.floor(PEAK_VUS * 0.5) }, // ramp-up
        { duration: TEST_DURATION, target: PEAK_VUS },           // sustained peak
        { duration: "30s", target: SPIKE_VUS },                  // spike
        { duration: "1m", target: SPIKE_VUS },                   // spike sustained
        { duration: "30s", target: PEAK_VUS },                   // recovery
        { duration: "1m", target: Math.floor(PEAK_VUS * 0.3) },  // wind-down
        { duration: "30s", target: 0 },                          // ramp-down
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<5000", "p(99)<10000"],
    http_req_failed: ["rate<0.10"],
    auth_success_rate: ["rate>0.90"],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function apiPost(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return http.post(`${BASE_URL}${path}`, JSON.stringify(body), { headers });
}

function apiGet(path, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return http.get(`${BASE_URL}${path}`, { headers });
}

function apiPatch(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return http.patch(`${BASE_URL}${path}`, JSON.stringify(body), { headers });
}

function apiDelete(path, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return http.del(`${BASE_URL}${path}`, null, { headers });
}

function extractData(res) {
  try {
    const body = res.json();
    return body && body.data ? body.data : body;
  } catch {
    return null;
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function nowISO() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

// ─── Setup ───────────────────────────────────────────────────────────────────

export function setup() {
  console.log("=== [Setup] Stress Test 시작 ===");

  const loginRes = apiPost("/api/v1/auth/login", {
    id: ADMIN_ID,
    password: ADMIN_PW,
  });
  check(loginRes, { "admin login": (r) => r.status === 200 });
  const loginData = extractData(loginRes);
  if (!loginData || !loginData.accessToken) {
    console.error(`[Setup] 관리자 로그인 실패: ${loginRes.status}`);
    return null;
  }

  let eventId = parseInt(PRESET_EVENT_ID, 10);
  let boothIds = PRESET_BOOTH_IDS
    ? PRESET_BOOTH_IDS.split(",").map((id) => parseInt(id.trim(), 10))
    : [];

  console.log(
    `=== [Setup] 완료 — eventId=${eventId}, booths=${boothIds.length}, peak=${PEAK_VUS}, spike=${SPIKE_VUS} ===`
  );

  return { adminToken: loginData.accessToken, eventId, boothIds };
}

// ─── Per-VU State (모듈 레벨 — VU별 독립, iteration 간 유지) ────────────────

let vuToken = null; // VU당 1회 인증 후 재사용

// ─── Main Scenario ───────────────────────────────────────────────────────────

export default function (data) {
  if (!data) return;

  const { eventId, boothIds } = data;
  const sessionId = `sess_${__VU}_${Date.now().toString(36)}`;
  const actionLogs = [];

  function addLog(action, targetType, targetId, metadata) {
    actionLogs.push({
      eventId,
      action,
      targetType,
      targetId: String(targetId),
      metadata: metadata || {},
      clientTimestamp: nowISO(),
      sessionId,
    });
  }

  // ── Phase 1: 방문자 인증 (VU당 최초 1회만) ────────────────────────────────

  if (!vuToken) {
    group("01_visitor_auth", function () {
      // SharedArray에서 VU 번호 기반으로 entry code 할당
      const codeIdx = (__VU - 1) % entryCodes.length;
      const entryCode = entryCodes[codeIdx];

      const res = apiPost("/api/v1/auth/visitors/entry-code/authenticate", {
        entryCode,
      });
      const ok = res.status === 200;
      authSuccess.add(ok);
      check(res, { "visitor auth": (r) => r.status === 200 });
      if (ok) {
        vuToken = extractData(res).accessToken;
      }
    });
  }

  if (!vuToken) {
    sleep(1);
    return;
  }

  const visitorToken = vuToken;
  addLog("APP_OPEN", "PAGE", "home", {});

  // ── Phase 2: 부스 목록 조회 ───────────────────────────────────────────────

  group("02_browse_booths", function () {
    const listRes = apiGet(
      `/api/v1/booths/events/${eventId}`,
      visitorToken
    );
    boothListDuration.add(listRes.timings.duration);
    check(listRes, { "booth list": (r) => r.status === 200 });
    addLog("PAGE_VIEW", "PAGE", "booth_list", {});
  });

  sleep(randomInt(1, 3));

  // ── Phase 3: 부스맵(지도) 조회 ────────────────────────────────────────────

  group("03_view_map", function () {
    const mapRes = apiGet(
      `/api/v1/boothmaps/events/${eventId}`,
      visitorToken
    );
    mapViewDuration.add(mapRes.timings.duration);
    check(mapRes, { "map view": (r) => r.status < 500 });
    addLog("MAP_INTERACTION", "MAP", "main_map", { action: "view" });
  });

  sleep(randomInt(1, 2));

  // ── Phase 4: 부스 상세 탐색 + 굿즈 확인 ──────────────────────────────────

  const visitCount = randomInt(2, Math.min(5, boothIds.length));
  const boothsToVisit = shuffle(boothIds).slice(0, visitCount);
  const myWaitings = [];

  for (const boothId of boothsToVisit) {
    group("04_booth_detail", function () {
      // 부스 상세 조회
      const detailRes = apiGet(`/api/v1/booths/${boothId}`, visitorToken);
      boothDetailDuration.add(detailRes.timings.duration);
      check(detailRes, { "booth detail": (r) => r.status === 200 });
      boothsViewed.add(1);
      addLog("BOOTH_VIEW", "BOOTH", boothId, {});

      sleep(randomInt(1, 3));

      // 굿즈 목록 조회 (70% 확률)
      if (Math.random() < 0.7) {
        const goodsRes = apiGet(
          `/api/v1/goods/booths/${boothId}`,
          visitorToken
        );
        goodsListDuration.add(goodsRes.timings.duration);
        check(goodsRes, { "goods list": (r) => r.status < 500 });
        addLog("GOODS_VIEW", "GOODS", `booth_${boothId}`, {});
        sleep(randomInt(1, 2));
      }
    });

    // ── Phase 5: 대기열 등록 (60% 확률) ───────────────────────────────────

    if (Math.random() < 0.6) {
      group("05_waiting_register", function () {
        // 예상 대기 시간 확인
        const timeRes = apiGet(
          `/api/v1/booths/${boothId}/waitings/expected-time`,
          visitorToken
        );
        waitingStatusDuration.add(timeRes.timings.duration);

        // 대기열 등록
        const waitRes = apiPost(
          `/api/v1/booths/${boothId}/waitings`,
          {},
          visitorToken
        );
        waitingCreateDuration.add(waitRes.timings.duration);

        if (waitRes.status === 200 || waitRes.status === 201) {
          const d = extractData(waitRes);
          const wid = d.waiting_id || d.waitingId || d.id;
          if (wid) {
            myWaitings.push({ waitingId: wid, boothId });
            waitingsCreated.add(1);
            addLog("WAITING_REGISTER", "BOOTH", boothId, { waitingId: wid });
          }
        }
        check(waitRes, {
          "waiting created": (r) => r.status === 200 || r.status === 201,
        });
      });
    }

    sleep(randomInt(1, 3));
  }

  // ── Phase 6: 내 대기 목록 확인 ────────────────────────────────────────────

  if (myWaitings.length > 0) {
    group("06_check_my_waitings", function () {
      const myRes = apiGet("/api/v1/visitors/me/waitings", visitorToken);
      waitingStatusDuration.add(myRes.timings.duration);
      check(myRes, { "my waitings": (r) => r.status === 200 });
      addLog("PAGE_VIEW", "PAGE", "my_waitings", {});
    });

    sleep(randomInt(2, 5));

    // ── Phase 7: 대기 미루기 / 취소 / 이용 완료 ────────────────────────────

    for (const w of myWaitings) {
      const roll = Math.random();

      if (roll < 0.15) {
        // 15%: 미루기
        group("07_waiting_postpone", function () {
          const res = apiPatch(
            `/api/v1/waitings/${w.waitingId}/postpone`,
            {},
            visitorToken
          );
          if (res.status === 200) {
            waitingsPostponed.add(1);
            addLog("WAITING_POSTPONE", "BOOTH", w.boothId, {
              waitingId: w.waitingId,
            });
          }
        });
        sleep(randomInt(2, 5));

        // 미루기 후 exit
        group("07_waiting_exit", function () {
          const res = apiPatch(
            `/api/v1/waitings/${w.waitingId}/exit`,
            {},
            visitorToken
          );
          if (res.status === 200) {
            waitingsExited.add(1);
            addLog("WAITING_EXIT", "BOOTH", w.boothId, {
              waitingId: w.waitingId,
            });
          }
        });
      } else if (roll < 0.35) {
        // 20%: 취소
        group("07_waiting_cancel", function () {
          const res = apiDelete(
            `/api/v1/waitings/${w.waitingId}`,
            visitorToken
          );
          if (res.status === 200 || res.status === 204) {
            waitingsCancelled.add(1);
            addLog("WAITING_CANCEL", "BOOTH", w.boothId, {
              waitingId: w.waitingId,
            });
          }
        });
      } else {
        // 65%: 이용 완료 (exit)
        group("07_waiting_exit", function () {
          sleep(randomInt(2, 5)); // 이용 시간 시뮬레이션
          const res = apiPatch(
            `/api/v1/waitings/${w.waitingId}/exit`,
            {},
            visitorToken
          );
          if (res.status === 200) {
            waitingsExited.add(1);
            addLog("WAITING_EXIT", "BOOTH", w.boothId, {
              waitingId: w.waitingId,
            });
          }
        });
      }

      sleep(randomInt(1, 2));
    }
  }

  // ── Phase 8: 추가 탐색 (부스맵 재조회, 다른 부스 클릭) ───────────────────

  group("08_extra_browsing", function () {
    // 지도 다시 보기
    if (Math.random() < 0.4) {
      apiGet(`/api/v1/boothmaps/events/${eventId}`, visitorToken);
      addLog("MAP_INTERACTION", "MAP", "main_map", { action: "zoom" });
    }

    // 대기열 큐 상태 확인 (아무 부스나)
    if (boothIds.length > 0 && Math.random() < 0.5) {
      const bid = pick(boothIds);
      apiGet(`/api/v1/booths/${bid}/queue`, visitorToken);
      addLog("PAGE_VIEW", "PAGE", `queue_${bid}`, {});
    }
  });

  // ── Phase 9: 행동 로그 벌크 전송 ──────────────────────────────────────────

  group("09_send_action_logs", function () {
    for (let i = 0; i < actionLogs.length; i += 100) {
      const batch = actionLogs.slice(i, i + 100);
      const res = apiPost("/api/v1/logs/actions", { logs: batch }, visitorToken);
      actionLogDuration.add(res.timings.duration);
      check(res, { "logs sent": (r) => r.status === 200 || r.status === 201 });
      actionLogsSent.add(batch.length);
    }
  });

  sleep(randomInt(1, 3));
}

// ─── Teardown ────────────────────────────────────────────────────────────────

export function teardown(data) {
  if (!data) return;
  console.log(`=== [Teardown] Stress Test 완료 ===`);
  console.log(`[Teardown] eventId: ${data.eventId}`);
}
