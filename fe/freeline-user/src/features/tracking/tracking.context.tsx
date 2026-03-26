import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { sendActionLogs } from './tracking.api';
import type { ActionLogEvent, ActionType, TargetType } from './tracking.types';

const FLUSH_INTERVAL_MS = 30_000;
const FLUSH_THRESHOLD = 20;
const MAX_BUFFER_SIZE = 200;
const API_BULK_LIMIT = 100;

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatLocalTimestamp() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

type TrackingContextValue = {
  trackEvent: (params: {
    action: ActionType;
    eventId?: number | null;
    targetType?: TargetType;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }) => void;
};

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({
  accessToken,
  eventId,
  children,
}: {
  accessToken: string | null;
  eventId: number | null;
  children: ReactNode;
}) {
  const bufferRef = useRef<ActionLogEvent[]>([]);
  const sessionIdRef = useRef(generateSessionId());
  const openedLoggedRef = useRef(false);

  const flush = useCallback(async () => {
    if (bufferRef.current.length === 0 || !accessToken) {
      return;
    }

    const logsToSend = [...bufferRef.current];
    bufferRef.current = [];

    try {
      for (let index = 0; index < logsToSend.length; index += API_BULK_LIMIT) {
        const chunk = logsToSend.slice(index, index + API_BULK_LIMIT);
        await sendActionLogs(accessToken, { logs: chunk });
      }
    } catch {
      const merged = [...logsToSend, ...bufferRef.current];
      bufferRef.current = merged.slice(-MAX_BUFFER_SIZE);
    }
  }, [accessToken]);

  useEffect(() => {
    const timer = setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [flush]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        void flush();
      }
    });

    return () => subscription.remove();
  }, [flush]);

  useEffect(() => {
    if (!accessToken || !eventId || openedLoggedRef.current) {
      return;
    }

    openedLoggedRef.current = true;
    bufferRef.current.push({
      eventId,
      action: 'APP_OPEN',
      targetType: 'PAGE',
      targetId: 'app',
      metadata: { source: 'realUser' },
      clientTimestamp: formatLocalTimestamp(),
      sessionId: sessionIdRef.current,
    });
  }, [accessToken, eventId]);

  const trackEvent = useCallback(
    (params: {
      action: ActionType;
      eventId?: number | null;
      targetType?: TargetType;
      targetId?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const resolvedEventId = params.eventId ?? eventId;

      if (!resolvedEventId) {
        return;
      }

      bufferRef.current.push({
        eventId: resolvedEventId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata,
        clientTimestamp: formatLocalTimestamp(),
        sessionId: sessionIdRef.current,
      });

      if (bufferRef.current.length >= FLUSH_THRESHOLD) {
        void flush();
      }
    },
    [eventId, flush],
  );

  return (
    <TrackingContext.Provider value={{ trackEvent }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);

  if (!context) {
    throw new Error('useTracking must be used within TrackingProvider');
  }

  return context;
}
