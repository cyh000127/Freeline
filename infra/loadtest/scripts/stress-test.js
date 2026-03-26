/**
 * Stress test with state-transition aware queue lifecycle.
 *
 * Visitor flow:
 *   WAITING -> (operator CALL) -> CALLED -> (visitor QR SCAN) -> REGISTERED
 *   -> (operator ADMIT) -> ENTERED -> (visitor EXIT) -> EXITED
 *
 * Operator flow:
 *   Poll booth queue -> CALL next waiting -> ADMIT registered waitings
 *
 * Some CALLED visitors intentionally do not scan QR to trigger EXPIRED path.
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import { SharedArray } from "k6/data";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.TARGET_URL || "https://j14a207.p.ssafy.io";
const ADMIN_ID = __ENV.ADMIN_ID || "";
const ADMIN_PW = __ENV.ADMIN_PW || "";

const PRESET_EVENT_ID = __ENV.PRESET_EVENT_ID || "";
const PRESET_BOOTH_IDS = __ENV.PRESET_BOOTH_IDS || "";

const PEAK_VUS = parseInt(__ENV.PEAK_VUS || "100", 10);
const SPIKE_VUS = parseInt(__ENV.SPIKE_VUS || String(PEAK_VUS * 2), 10);
const TEST_DURATION = __ENV.TEST_DURATION || "3m";

const OPERATOR_VUS = parseInt(__ENV.OPERATOR_VUS || "3", 10);
const OPERATOR_DURATION = __ENV.OPERATOR_DURATION || "8m";
const OPERATOR_LOOP_SLEEP = parseFloat(__ENV.OPERATOR_LOOP_SLEEP || "0.8");
const OPERATOR_ADMIT_BATCH = parseInt(__ENV.OPERATOR_ADMIT_BATCH || "2", 10);

const WAITING_JOIN_RATE = clampRate(__ENV.WAITING_JOIN_RATE || "0.60");
const NO_SHOW_RATE = clampRate(__ENV.NO_SHOW_RATE || "0.25");
const CANCEL_RATE = clampRate(__ENV.CANCEL_RATE || "0.10");
const POSTPONE_RATE = clampRate(__ENV.POSTPONE_RATE || "0.05");

const MIN_STAY_SECONDS = parseInt(__ENV.MIN_STAY_SECONDS || "10", 10);
const MAX_STAY_SECONDS = parseInt(__ENV.MAX_STAY_SECONDS || "40", 10);

const ENTRY_CODES_FILE = __ENV.ENTRY_CODES_FILE || "/scripts/entry_codes.json";
const entryCodes = new SharedArray("entryCodes", function () {
  return JSON.parse(open(ENTRY_CODES_FILE));
});

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

const authSuccess = new Rate("auth_success_rate");
const queueCallSuccess = new Rate("queue_call_success_rate");
const qrRegisterSuccess = new Rate("qr_register_success_rate");
const admitSuccess = new Rate("admit_success_rate");
const exitSuccess = new Rate("exit_success_rate");

const boothListDuration = new Trend("booth_list_duration");
const boothDetailDuration = new Trend("booth_detail_duration");
const goodsListDuration = new Trend("goods_list_duration");
const mapViewDuration = new Trend("map_view_duration");
const waitingCreateDuration = new Trend("waiting_create_duration");
const waitingStatusDuration = new Trend("waiting_status_duration");
const actionLogDuration = new Trend("action_log_duration");
const operatorQueueDuration = new Trend("operator_queue_duration");

const waitingsCreated = new Counter("waitings_created");
const waitingsCancelled = new Counter("waitings_cancelled");
const waitingsPostponed = new Counter("waitings_postponed");
const waitingsAdmitted = new Counter("waitings_admitted");
const waitingsExited = new Counter("waitings_exited");
const queueCalls = new Counter("queue_calls");
const qrRegistered = new Counter("qr_registered");
const calledSeen = new Counter("called_seen");
const noShowIntended = new Counter("called_noshow_intended");
const actionLogsSent = new Counter("action_logs_sent");
const boothsViewed = new Counter("booths_viewed");

// ---------------------------------------------------------------------------
// k6 options
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    visitor_flow: {
      exec: "visitorFlow",
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: Math.floor(PEAK_VUS * 0.5) },
        { duration: TEST_DURATION, target: PEAK_VUS },
        { duration: "30s", target: SPIKE_VUS },
        { duration: "1m", target: SPIKE_VUS },
        { duration: "30s", target: PEAK_VUS },
        { duration: "1m", target: Math.floor(PEAK_VUS * 0.3) },
        { duration: "30s", target: 0 },
      ],
    },
    booth_operator_flow: {
      exec: "boothOperatorFlow",
      executor: "constant-vus",
      startTime: "5s",
      vus: OPERATOR_VUS,
      duration: OPERATOR_DURATION,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<5000", "p(99)<10000"],
    http_req_failed: ["rate<0.10"],
    auth_success_rate: ["rate>0.90"],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampRate(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

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
    if (body && Object.prototype.hasOwnProperty.call(body, "data")) {
      return body.data;
    }
    return body;
  } catch (_) {
    return null;
  }
}

function normalizeStatus(status) {
  if (!status) return "";
  return String(status).toUpperCase();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function nowIsoLike() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

function queueListFrom(queuePayload) {
  if (!queuePayload) return [];
  return queuePayload.queueList || queuePayload.queue_list || [];
}

function waitingsFrom(myPayload) {
  if (!myPayload) return [];
  return myPayload.waitings || [];
}

function isPostponeAvailable(waiting) {
  if (!waiting) return false;
  if (typeof waiting.postponeAvailable === "boolean") return waiting.postponeAvailable;
  if (typeof waiting.postpone_available === "boolean") return waiting.postpone_available;
  return Boolean(waiting.postponeAvailable || waiting.postpone_available);
}

function resolveWaitingId(payload) {
  if (!payload) return null;
  return payload.waitingId || payload.waiting_id || payload.id || null;
}

function ensureBoothQrCode(boothId, adminToken) {
  const getRes = apiGet(`/api/v1/qr/booths/${boothId}`, adminToken);
  if (getRes.status === 200) {
    const data = extractData(getRes);
    if (data && data.qrCode) return data.qrCode;
  }

  const createRes = apiPost(`/api/v1/qr/booths/${boothId}`, {}, adminToken);
  if (createRes.status === 200 || createRes.status === 201) {
    const data = extractData(createRes);
    if (data && data.qrCode) return data.qrCode;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export function setup() {
  console.log("=== [Setup] Stress Test with queue lifecycle ===");

  if (!PRESET_EVENT_ID || !PRESET_BOOTH_IDS) {
    console.error("[Setup] PRESET_EVENT_ID/PRESET_BOOTH_IDS is required.");
    return null;
  }

  const loginRes = apiPost("/api/v1/auth/login", {
    id: ADMIN_ID,
    password: ADMIN_PW,
  });
  check(loginRes, { "admin login": (r) => r.status === 200 });
  const loginData = extractData(loginRes);
  if (!loginData || !loginData.accessToken) {
    console.error(`[Setup] admin login failed: ${loginRes.status}`);
    return null;
  }

  const eventId = parseInt(PRESET_EVENT_ID, 10);
  const boothIds = PRESET_BOOTH_IDS.split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => Number.isFinite(id));

  if (!Number.isFinite(eventId) || boothIds.length === 0) {
    console.error("[Setup] invalid event/booth preset values.");
    return null;
  }

  const boothQrCodes = {};
  for (const boothId of boothIds) {
    const qrCode = ensureBoothQrCode(boothId, loginData.accessToken);
    if (qrCode) {
      boothQrCodes[String(boothId)] = qrCode;
    } else {
      console.warn(`[Setup] QR unavailable for boothId=${boothId}`);
    }
  }

  console.log(
    `[Setup] eventId=${eventId}, booths=${boothIds.length}, entryCodes=${entryCodes.length}, operators=${OPERATOR_VUS}`
  );

  return {
    adminToken: loginData.accessToken,
    eventId,
    boothIds,
    boothQrCodes,
  };
}

// ---------------------------------------------------------------------------
// Visitor flow state (per VU runtime)
// ---------------------------------------------------------------------------

let visitorToken = null;
let visitorEntryCode = null;
const waitingBoothById = {};
const waitingExitDueAtById = {};

function ensureVisitorAuth() {
  if (visitorToken) {
    return true;
  }

  if (entryCodes.length === 0) {
    authSuccess.add(false);
    return false;
  }

  const entryIndex = (__VU - 1) % entryCodes.length;
  visitorEntryCode = entryCodes[entryIndex];

  const res = apiPost("/api/v1/auth/visitors/entry-code/authenticate", {
    entryCode: visitorEntryCode,
  });
  const ok = res.status === 200;
  authSuccess.add(ok);
  check(res, { "visitor auth": (r) => r.status === 200 });
  if (!ok) {
    return false;
  }

  const authData = extractData(res);
  if (!authData || !authData.accessToken) {
    authSuccess.add(false);
    return false;
  }

  visitorToken = authData.accessToken;
  return true;
}

function cleanupWaitingState(waitingId) {
  delete waitingBoothById[waitingId];
  delete waitingExitDueAtById[waitingId];
}

function addActionLog(actionLogs, eventId, action, targetType, targetId, metadata) {
  actionLogs.push({
    eventId,
    action,
    targetType,
    targetId: String(targetId),
    metadata: metadata || {},
    clientTimestamp: nowIsoLike(),
    sessionId: `sess_${__VU}_${Date.now().toString(36)}`,
  });
}

function processMyWaitings(data, actionLogs) {
  const res = apiGet("/api/v1/visitors/me/waitings", visitorToken);
  waitingStatusDuration.add(res.timings.duration);
  if (res.status !== 200) {
    return;
  }

  const payload = extractData(res);
  const waitings = waitingsFrom(payload);

  for (const waiting of waitings) {
    const waitingId = resolveWaitingId(waiting);
    const status = normalizeStatus(waiting.status);
    const boothId = waitingBoothById[waitingId];

    if (!waitingId) {
      continue;
    }

    if (status === "WAITING") {
      if (isPostponeAvailable(waiting) && Math.random() < POSTPONE_RATE) {
        const postponeRes = apiPatch(`/api/v1/waitings/${waitingId}/postpone`, {}, visitorToken);
        if (postponeRes.status === 200) {
          waitingsPostponed.add(1);
        }
      }

      if (Math.random() < CANCEL_RATE) {
        const cancelRes = apiDelete(`/api/v1/waitings/${waitingId}`, visitorToken);
        if (cancelRes.status === 200 || cancelRes.status === 204) {
          waitingsCancelled.add(1);
          cleanupWaitingState(waitingId);
        }
      }
      continue;
    }

    if (status === "CALLED") {
      calledSeen.add(1);

      if (Math.random() < NO_SHOW_RATE) {
        noShowIntended.add(1);
        continue;
      }

      if (!boothId) {
        continue;
      }

      const qrCode = data.boothQrCodes[String(boothId)];
      if (!qrCode) {
        continue;
      }

      const scanRes = apiPost("/api/v1/qr/scan", { qrCode }, visitorToken);
      const scanOk = scanRes.status === 200;
      qrRegisterSuccess.add(scanOk);
      if (scanOk) {
        qrRegistered.add(1);
        addActionLog(actionLogs, data.eventId, "WAITING_COMPLETE", "BOOTH", boothId, {
          waitingId,
        });
      }
      continue;
    }

    if (status === "ENTERED") {
      if (!waitingExitDueAtById[waitingId]) {
        waitingExitDueAtById[waitingId] =
          Date.now() + randomInt(MIN_STAY_SECONDS, MAX_STAY_SECONDS) * 1000;
      }

      if (Date.now() >= waitingExitDueAtById[waitingId]) {
        const exitRes = apiPatch(`/api/v1/waitings/${waitingId}/exit`, {}, visitorToken);
        const exitOk = exitRes.status === 200;
        exitSuccess.add(exitOk);
        if (exitOk) {
          waitingsExited.add(1);
          addActionLog(actionLogs, data.eventId, "WAITING_EXIT", "BOOTH", boothId || "unknown", {
            waitingId,
          });
          cleanupWaitingState(waitingId);
        }
      }
      continue;
    }

    if (status === "EXITED" || status === "CANCELED" || status === "EXPIRED") {
      cleanupWaitingState(waitingId);
    }
  }
}

function sendActionLogs(actionLogs) {
  if (actionLogs.length === 0) {
    return;
  }

  for (let i = 0; i < actionLogs.length; i += 100) {
    const batch = actionLogs.slice(i, i + 100);
    const res = apiPost("/api/v1/logs/actions", { logs: batch }, visitorToken);
    actionLogDuration.add(res.timings.duration);
    check(res, { "logs sent": (r) => r.status === 200 || r.status === 201 });
    if (res.status === 200 || res.status === 201) {
      actionLogsSent.add(batch.length);
    }
  }
}

// ---------------------------------------------------------------------------
// Scenario: Visitors
// ---------------------------------------------------------------------------

export function visitorFlow(data) {
  if (!data) {
    sleep(1);
    return;
  }

  if (!ensureVisitorAuth()) {
    sleep(1);
    return;
  }

  const { eventId, boothIds } = data;
  if (!boothIds || boothIds.length === 0) {
    sleep(1);
    return;
  }

  const actionLogs = [];
  addActionLog(actionLogs, eventId, "APP_OPEN", "PAGE", "home", {});

  group("01_browse_list", function () {
    const listRes = apiGet(`/api/v1/booths/events/${eventId}`, visitorToken);
    boothListDuration.add(listRes.timings.duration);
    check(listRes, { "booth list": (r) => r.status === 200 });
  });

  group("02_view_map", function () {
    const mapRes = apiGet(`/api/v1/boothmaps/events/${eventId}`, visitorToken);
    mapViewDuration.add(mapRes.timings.duration);
    check(mapRes, { "map view": (r) => r.status < 500 });
  });

  const boothsToVisit = shuffle(boothIds).slice(0, randomInt(2, Math.min(5, boothIds.length)));

  for (const boothId of boothsToVisit) {
    group("03_booth_detail", function () {
      const detailRes = apiGet(`/api/v1/booths/${boothId}`, visitorToken);
      boothDetailDuration.add(detailRes.timings.duration);
      check(detailRes, { "booth detail": (r) => r.status === 200 });
      if (detailRes.status === 200) {
        boothsViewed.add(1);
        addActionLog(actionLogs, eventId, "BOOTH_VIEW", "BOOTH", boothId, {});
      }

      if (Math.random() < 0.7) {
        const goodsRes = apiGet(`/api/v1/goods/booths/${boothId}`, visitorToken);
        goodsListDuration.add(goodsRes.timings.duration);
        check(goodsRes, { "goods list": (r) => r.status < 500 });
      }
    });

    if (Math.random() < WAITING_JOIN_RATE) {
      group("04_waiting_create", function () {
        const waitRes = apiPost(`/api/v1/booths/${boothId}/waitings`, {}, visitorToken);
        waitingCreateDuration.add(waitRes.timings.duration);
        check(waitRes, {
          "waiting created": (r) => r.status === 200 || r.status === 201,
        });

        if (waitRes.status === 200 || waitRes.status === 201) {
          const waitingData = extractData(waitRes);
          const waitingId = resolveWaitingId(waitingData);
          if (waitingId) {
            waitingBoothById[waitingId] = boothId;
          }
          waitingsCreated.add(1);
          addActionLog(actionLogs, eventId, "WAITING_REGISTER", "BOOTH", boothId, {
            waitingId,
          });
        }
      });
    }

    sleep(randomInt(1, 2));
  }

  processMyWaitings(data, actionLogs);
  sendActionLogs(actionLogs);

  sleep(randomInt(1, 3));
}

// ---------------------------------------------------------------------------
// Scenario: Booth operators
// ---------------------------------------------------------------------------

export function boothOperatorFlow(data) {
  if (!data || !data.adminToken || !data.boothIds || data.boothIds.length === 0) {
    sleep(1);
    return;
  }

  const adminToken = data.adminToken;
  const boothIndex = (__ITER + __VU - 1) % data.boothIds.length;
  const boothId = data.boothIds[boothIndex];

  // 1) Poll current queue
  const queueRes = apiGet(`/api/v1/booths/me/queue?boothId=${boothId}`, adminToken);
  operatorQueueDuration.add(queueRes.timings.duration);
  if (queueRes.status !== 200) {
    sleep(OPERATOR_LOOP_SLEEP);
    return;
  }

  const queuePayload = extractData(queueRes);
  const queueList = queueListFrom(queuePayload);

  // 2) Call next waiting only when there is a WAITING candidate.
  const hasWaitingCandidate = queueList.some((item) => normalizeStatus(item.status) === "WAITING");
  const frontQueueCount = queueList.filter((item) => {
    const status = normalizeStatus(item.status);
    return status === "CALLED" || status === "REGISTERED";
  }).length;

  if (hasWaitingCandidate && frontQueueCount === 0) {
    const callRes = apiPatch(`/api/v1/booths/me/waitings/call?boothId=${boothId}`, {}, adminToken);
    const callOk = callRes.status === 200;
    queueCallSuccess.add(callOk);
    if (callOk) {
      queueCalls.add(1);
    }
  }

  // 3) Re-poll and admit REGISTERED visitors to ENTERED.
  const refreshRes = apiGet(`/api/v1/booths/me/queue?boothId=${boothId}`, adminToken);
  if (refreshRes.status === 200) {
    const refreshPayload = extractData(refreshRes);
    const refreshQueue = queueListFrom(refreshPayload);
    const registeredItems = refreshQueue
      .filter((item) => normalizeStatus(item.status) === "REGISTERED")
      .slice(0, OPERATOR_ADMIT_BATCH);

    for (const item of registeredItems) {
      const waitingId = resolveWaitingId(item);
      if (!waitingId) {
        continue;
      }

      const admitRes = apiPatch(
        `/api/v1/waitings/${waitingId}/admit?boothId=${boothId}`,
        {},
        adminToken
      );
      const admitOk = admitRes.status === 200;
      admitSuccess.add(admitOk);
      if (admitOk) {
        waitingsAdmitted.add(1);
      }
    }
  }

  sleep(OPERATOR_LOOP_SLEEP + Math.random() * 0.5);
}

// Default for compatibility.
export default function (data) {
  visitorFlow(data);
}

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------

export function teardown(data) {
  if (!data) {
    return;
  }

  console.log("=== [Teardown] Stress Test completed ===");
  console.log(`[Teardown] eventId=${data.eventId}`);
  console.log(
    `[Teardown] peak=${PEAK_VUS}, spike=${SPIKE_VUS}, operators=${OPERATOR_VUS}, noShowRate=${NO_SHOW_RATE}`
  );
}
