/**
 * E2E 리포트 파이프라인 부하 테스트
 *
 * 전체 흐름:
 *   setup()   → 관리자 로그인, 행사/부스 생성, 행사 OPEN
 *   scenario  → VU마다 방문자 인증 → 부스 조회 → 대기 등록/취소 → 행동 로그 벌크 전송
 *   teardown()→ (비워둠 — 리포트 트리거는 e2e-report-verify.sh에서 수행)
 *
 * 환경 변수:
 *   TARGET_URL      — API 서버 (기본: https://j14a207.p.ssafy.io)
 *   ADMIN_ID        — 관리자 로그인 ID
 *   ADMIN_PW        — 관리자 비밀번호
 *   VU_COUNT        — 동시 사용자 수 (기본: 50)
 *   ITERATIONS      — VU당 반복 횟수 (기본: 10)
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { SharedArray } from "k6/data";
import { Counter, Trend } from "k6/metrics";

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = __ENV.TARGET_URL || "https://j14a207.p.ssafy.io";
const ADMIN_ID = __ENV.ADMIN_ID || "admin@freeline.com";
const ADMIN_PW = __ENV.ADMIN_PW || "password123!";
const VU_COUNT = parseInt(__ENV.VU_COUNT || "50", 10);
const ITERATIONS = parseInt(__ENV.ITERATIONS || "10", 10);
const BOOTH_COUNT = 10;

// ─── Custom Metrics ──────────────────────────────────────────────────────────

const actionLogsSent = new Counter("action_logs_sent");
const waitingsCreated = new Counter("waitings_created");
const waitingsCancelled = new Counter("waitings_cancelled");
const boothViewDuration = new Trend("booth_view_duration");

// ─── Options ─────────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    visitor_simulation: {
      executor: "per-vu-iterations",
      vus: VU_COUNT,
      iterations: ITERATIONS,
      maxDuration: "10m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.05"],
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
    if (body && body.data) return body.data;
    return body;
  } catch {
    return null;
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function generateSessionId() {
  return "sess_" + Math.random().toString(36).substring(2, 15);
}

function nowISO() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

// ─── Setup ───────────────────────────────────────────────────────────────────

export function setup() {
  console.log("=== [Setup] E2E Report Test 시작 ===");

  // 1. 관리자 로그인
  const loginRes = apiPost("/api/v1/auth/login", {
    id: ADMIN_ID,
    password: ADMIN_PW,
  });
  check(loginRes, { "admin login": (r) => r.status === 200 });
  const loginData = extractData(loginRes);
  const adminToken = loginData.accessToken;
  console.log(`[Setup] 관리자 로그인 완료`);

  // 2. 행사 생성
  const today = new Date();
  const startDate = today.toISOString().substring(0, 10);
  const endDate = new Date(today.getTime() + 3 * 86400000)
    .toISOString()
    .substring(0, 10);

  const eventRes = apiPost(
    "/api/v1/events",
    {
      name: `[E2E Test] 리포트 테스트 행사 ${Date.now()}`,
      description: "k6 E2E 리포트 파이프라인 테스트용 자동 생성 행사",
      startDate: startDate,
      endDate: endDate,
      openTime: "09:00:00",
      closeTime: "18:00:00",
      locationAddress: "서울특별시 강남구 테헤란로 212",
    },
    adminToken
  );
  check(eventRes, {
    "event created": (r) => r.status === 200 || r.status === 201,
  });
  const eventData = extractData(eventRes);
  const eventId = eventData.eventId || eventData.id;
  console.log(`[Setup] 행사 생성: eventId=${eventId}`);

  // 3. 부스 10개 생성
  const boothIds = [];
  const boothNames = [
    "삼성전자", "LG전자", "현대자동차", "SK하이닉스", "네이버",
    "카카오", "쿠팡", "배달의민족", "토스", "당근마켓",
  ];

  for (let i = 0; i < BOOTH_COUNT; i++) {
    const boothRes = apiPost(
      `/api/v1/booths/events/${eventId}`,
      {
        name: boothNames[i],
        locationCode: `${String.fromCharCode(65 + i)}-01`,
        openTime: "09:00:00",
        closeTime: "18:00:00",
      },
      adminToken
    );
    const boothData = extractData(boothRes);
    if (boothData) {
      const bid = boothData.boothId || boothData.id;
      boothIds.push(bid);
    }
  }
  console.log(`[Setup] 부스 ${boothIds.length}개 생성: ${boothIds}`);

  // 4. 행사 OPEN
  const openRes = apiPatch(
    `/api/v1/events/${eventId}`,
    { status: "OPEN" },
    adminToken
  );
  check(openRes, {
    "event opened": (r) => r.status === 200,
  });
  console.log(`[Setup] 행사 OPEN 완료`);

  // 5. 방문자 entry code 목록 (e2e-report-verify.sh 에서 psql로 사전 생성)
  //    entry code 형식: E2E + 3자리 숫자 (E2E001 ~ E2E{VU_COUNT})
  const entryCodes = [];
  for (let i = 1; i <= VU_COUNT; i++) {
    entryCodes.push(`E2E${String(i).padStart(3, "0")}`);
  }

  console.log(`=== [Setup] 완료 — eventId=${eventId}, booths=${boothIds.length}, visitors=${entryCodes.length} ===`);

  return {
    adminToken,
    eventId,
    boothIds,
    boothNames,
    entryCodes,
  };
}

// ─── Main Scenario ───────────────────────────────────────────────────────────

export default function (data) {
  const { eventId, boothIds, boothNames, entryCodes } = data;
  const vuId = __VU - 1; // 0-indexed
  const entryCode = entryCodes[vuId % entryCodes.length];
  const sessionId = generateSessionId();
  const actionLogs = [];

  // Helper: 행동 로그 추가
  function addLog(action, targetType, targetId, metadata) {
    actionLogs.push({
      eventId: eventId,
      action: action,
      targetType: targetType,
      targetId: String(targetId),
      metadata: metadata || {},
      clientTimestamp: nowISO(),
      sessionId: sessionId,
    });
  }

  // 1. 방문자 인증
  let visitorToken = null;
  group("visitor_auth", function () {
    const authRes = apiPost("/api/v1/auth/visitors/entry-code/authenticate", {
      entryCode: entryCode,
    });
    if (authRes.status === 200) {
      const authData = extractData(authRes);
      visitorToken = authData.accessToken;
    }
    check(authRes, {
      "visitor authenticated": (r) => r.status === 200,
    });
  });

  if (!visitorToken) {
    console.warn(`[VU ${__VU}] 인증 실패: entryCode=${entryCode}`);
    return;
  }

  // app_open 로그
  addLog("APP_OPEN", "PAGE", "home", {});

  // 2. 부스 탐색 (3~5개 랜덤 선택)
  const visitCount = randomInt(3, Math.min(5, boothIds.length));
  const shuffled = [...boothIds].sort(() => Math.random() - 0.5);
  const visitBooths = shuffled.slice(0, visitCount);

  group("booth_browsing", function () {
    for (const boothId of visitBooths) {
      // booth_view 로그
      const idx = boothIds.indexOf(boothId);
      addLog("BOOTH_VIEW", "BOOTH", boothId, {
        boothName: boothNames[idx] || "Unknown",
      });
      boothViewDuration.add(randomInt(3, 15)); // 체류 시간 시뮬레이션

      // page_view 로그
      addLog("PAGE_VIEW", "PAGE", `booth_detail_${boothId}`, {});

      sleep(randomInt(1, 2) * 0.5);
    }
  });

  // 3. 대기 등록 (방문한 부스 중 50% 확률)
  const waitingIds = [];
  group("waiting_registration", function () {
    for (const boothId of visitBooths) {
      if (Math.random() < 0.5) {
        const waitRes = apiPost(
          `/api/v1/booths/${boothId}/waitings`,
          {},
          visitorToken
        );

        if (waitRes.status === 200 || waitRes.status === 201) {
          const waitData = extractData(waitRes);
          const wid = waitData.waitingId || waitData.id;
          if (wid) waitingIds.push({ waitingId: wid, boothId: boothId });
          waitingsCreated.add(1);

          addLog("WAITING_REGISTER", "BOOTH", boothId, {
            waitingId: wid,
          });
        }

        sleep(0.5);
      }
    }
  });

  // 4. 대기 취소 (등록한 것 중 30% 확률)
  group("waiting_cancellation", function () {
    for (const w of waitingIds) {
      if (Math.random() < 0.3) {
        const cancelRes = apiDelete(
          `/api/v1/waitings/${w.waitingId}`,
          visitorToken
        );

        if (cancelRes.status === 200 || cancelRes.status === 204) {
          waitingsCancelled.add(1);
          addLog("WAITING_CANCEL", "BOOTH", w.boothId, {
            waitingId: w.waitingId,
          });
        }
      }
    }
  });

  // 5. 추가 행동 로그 (지도, 상품 조회 등)
  addLog("MAP_INTERACTION", "MAP", "main_map", { action: "zoom" });
  if (visitBooths.length > 0) {
    addLog("GOODS_VIEW", "GOODS", `goods_${visitBooths[0]}`, {});
  }

  // 6. 행동 로그 벌크 전송 (최대 100건씩)
  group("send_action_logs", function () {
    for (let i = 0; i < actionLogs.length; i += 100) {
      const batch = actionLogs.slice(i, i + 100);
      const logRes = apiPost(
        "/api/v1/logs/actions",
        { logs: batch },
        visitorToken
      );
      check(logRes, {
        "logs sent": (r) => r.status === 200 || r.status === 201,
      });
      actionLogsSent.add(batch.length);
    }
  });

  sleep(randomInt(1, 3));
}

// ─── Teardown ────────────────────────────────────────────────────────────────

export function teardown(data) {
  console.log(`=== [Teardown] 부하 생성 완료 ===`);
  console.log(`[Teardown] eventId: ${data.eventId}`);
  console.log(`[Teardown] 다음 단계: e2e-report-verify.sh 에서 CLOSED + 리포트 생성 실행`);

  // eventId를 파일로 출력 (셸 스크립트에서 참조용)
  // k6는 파일 쓰기 불가이므로 console.log로 출력
  console.log(`EVENT_ID=${data.eventId}`);
  console.log(`ADMIN_TOKEN=${data.adminToken}`);
}
