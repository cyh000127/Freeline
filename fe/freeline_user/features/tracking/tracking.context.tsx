import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { ActionLogEvent, ActionType, TargetType } from './tracking.types';
import { sendActionLogs } from './tracking.api';

const FLUSH_INTERVAL_MS = 30_000;
const FLUSH_THRESHOLD = 20;
const MAX_BUFFER_SIZE = 200;
const API_BULK_LIMIT = 100;

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function formatLocalTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

interface TrackingContextValue {
  trackEvent: (params: {
    action: ActionType;
    eventId: number;
    targetType?: TargetType;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }) => void;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

interface TrackingProviderProps {
  accessToken: string | null;
  children: React.ReactNode;
}

export function TrackingProvider({ accessToken, children }: TrackingProviderProps) {
  const bufferRef = useRef<ActionLogEvent[]>([]);
  const sessionIdRef = useRef(generateSessionId());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flush = useCallback(async () => {
    if (bufferRef.current.length === 0 || !accessToken) return;

    const logsToSend = [...bufferRef.current];
    bufferRef.current = [];

    try {
      // 백엔드 벌크 제한(100건)에 맞춰 분할 전송
      for (let i = 0; i < logsToSend.length; i += API_BULK_LIMIT) {
        const chunk = logsToSend.slice(i, i + API_BULK_LIMIT);
        await sendActionLogs(accessToken, { logs: chunk });
      }
    } catch {
      // 전송 실패 시 버퍼에 다시 추가 (최대 크기 초과 시 오래된 것 버림)
      const merged = [...logsToSend, ...bufferRef.current];
      bufferRef.current = merged.slice(-MAX_BUFFER_SIZE);
    }
  }, [accessToken]);

  // 주기적 flush (30초)
  useEffect(() => {
    timerRef.current = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [flush]);

  // 앱이 백그라운드로 갈 때 flush
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        flush();
      }
    });
    return () => subscription.remove();
  }, [flush]);

  const trackEvent = useCallback(
    (params: {
      action: ActionType;
      eventId: number;
      targetType?: TargetType;
      targetId?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const event: ActionLogEvent = {
        eventId: params.eventId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata,
        clientTimestamp: formatLocalTimestamp(),
        sessionId: sessionIdRef.current,
      };

      bufferRef.current.push(event);

      // 임계값 도달 시 즉시 flush
      if (bufferRef.current.length >= FLUSH_THRESHOLD) {
        flush();
      }
    },
    [flush],
  );

  return (
    <TrackingContext.Provider value={{ trackEvent }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextValue {
  const ctx = useContext(TrackingContext);
  if (!ctx) {
    throw new Error('useTracking must be used within TrackingProvider');
  }
  return ctx;
}
