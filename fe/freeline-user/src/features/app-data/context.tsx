import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  fetchBoothDetail,
  fetchBooths,
  fetchExpectedTime,
  type BoothDetail,
  type BoothSummary,
} from '@/features/api/booths';
import {
  cancelWaiting as cancelWaitingApi,
  createWaiting as createWaitingApi,
  exitWaiting as exitWaitingApi,
  fetchMyWaitings,
  postponeWaiting as postponeWaitingApi,
  type QueueStatus,
  type WaitingStatus,
} from '@/features/api/waitings';
import { scanQr as scanQrApi } from '@/features/api/qr';
import { useSession } from '@/features/session/context';
import { useTracking } from '@/features/tracking/tracking.context';
import { toUserErrorMessage } from '@/utils/error';
import type { AppDataState, DecoratedWaiting, WaitingHistoryItem } from './types';

type AppDataContextValue = AppDataState & {
  currentExperience: DecoratedWaiting | null;
  queueWaitings: DecoratedWaiting[];
  selectedBooth: BoothSummary | null;
  selectBooth: (boothId: number | null) => void;
  refreshAll: () => Promise<void>;
  getBoothDetail: (boothId: number) => Promise<BoothDetail>;
  createWaiting: (boothId: number) => Promise<void>;
  cancelWaiting: (waiting: DecoratedWaiting) => Promise<void>;
  postponeWaiting: (waiting: DecoratedWaiting) => Promise<void>;
  exitWaiting: (waiting: DecoratedWaiting) => Promise<void>;
  scanQr: (qrCode: string) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const initialState: AppDataState = {
  isLoading: true,
  isRefreshing: false,
  lastError: null,
  booths: [],
  boothDetails: {},
  waitings: [],
  queueStatus: 'FREE',
  history: [],
  selectedBoothId: null,
};

function historyEntry(waiting: DecoratedWaiting, status: WaitingStatus): WaitingHistoryItem {
  return {
    waitingId: waiting.waiting_id,
    boothName: waiting.booth_name,
    boothId: waiting.boothId,
    status,
    timestamp: new Date().toISOString(),
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { accessToken, eventId } = useSession();
  const { trackEvent } = useTracking();
  const [state, setState] = useState<AppDataState>(initialState);

  // Initial load is keyed only by auth/session changes; manual refresh uses the public action.
  useEffect(() => {
    if (!accessToken || !eventId) {
      setState(initialState);
      return;
    }

    async function run() {
      await refreshAll(true);
    }

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, eventId]);

  async function loadBooths(token: string, targetEventId: number) {
    const booths = await fetchBooths(targetEventId, token);
    return booths.sort((left, right) => left.locationCode.localeCompare(right.locationCode));
  }

  async function decorateWaitings(
    token: string,
    booths: BoothSummary[],
    boothDetails: Record<number, BoothDetail>,
  ) {
    const waitingPayload = await fetchMyWaitings(token);

    const waitings = await Promise.all(
      waitingPayload.waitings.map(async (waiting) => {
        const matchedBooth =
          booths.find((booth) => booth.name === waiting.booth_name) ?? null;

        let estimatedMinutes: number | null = null;
        let boothDetail = matchedBooth ? boothDetails[matchedBooth.boothId] : undefined;

        if (matchedBooth) {
          try {
            const expected = await fetchExpectedTime(matchedBooth.boothId, token);
            estimatedMinutes = expected.estimated_minutes;
          } catch (error) {
            console.warn('예상 대기시간 조회 실패', error);
          }

          if (!boothDetail) {
            try {
              boothDetail = await fetchBoothDetail(matchedBooth.boothId, token);
            } catch (error) {
              console.warn('부스 상세 조회 실패', error);
            }
          }
        }

        const next: DecoratedWaiting = {
          ...waiting,
          boothId: matchedBooth?.boothId ?? null,
          locationCode: matchedBooth?.locationCode ?? null,
          estimatedMinutes,
          boothDetail,
        };

        return next;
      }),
    );

    return {
      queueStatus: waitingPayload.visitor_queue_status as QueueStatus,
      waitings,
    };
  }

  async function refreshAll(isInitial = false) {
    if (!accessToken || !eventId) {
      return;
    }

    setState((current) => ({
      ...current,
        isLoading: isInitial,
        isRefreshing: !isInitial,
        lastError: null,
      }));

    try {
      const booths = await loadBooths(accessToken, eventId);
      const decorated = await decorateWaitings(accessToken, booths, state.boothDetails);
      const selectedExists = booths.some((booth) => booth.boothId === state.selectedBoothId);

      setState((current) => ({
        ...current,
        booths,
        waitings: decorated.waitings,
        queueStatus: decorated.queueStatus,
        selectedBoothId: selectedExists
          ? current.selectedBoothId
          : booths[0]?.boothId ?? null,
        isLoading: false,
        isRefreshing: false,
        lastError: null,
      }));
    } catch (error) {
      const message = toUserErrorMessage(error, '앱 데이터를 불러오지 못했습니다.');
      console.warn('앱 데이터 새로고침 실패', error);
      setState((current) => ({
        ...current,
        isLoading: false,
        isRefreshing: false,
        lastError: message,
      }));
    }
  }

  async function getBoothDetailById(boothId: number) {
    if (!accessToken) {
      throw new Error('로그인이 필요합니다.');
    }

    const cached = state.boothDetails[boothId];
    if (cached) {
      return cached;
    }

    const detail = await fetchBoothDetail(boothId, accessToken);

    trackEvent({
      action: 'BOOTH_VIEW',
      targetType: 'BOOTH',
      targetId: String(boothId),
      metadata: {
        booth_name: detail.name,
        location_code: detail.locationCode,
      },
    });

    setState((current) => ({
      ...current,
      boothDetails: {
        ...current.boothDetails,
        [boothId]: detail,
      },
      waitings: current.waitings.map((waiting) =>
        waiting.boothId === boothId ? { ...waiting, boothDetail: detail } : waiting,
      ),
    }));

    return detail;
  }

  async function createWaiting(boothId: number) {
    if (!accessToken) {
      throw new Error('로그인이 필요합니다.');
    }

    await createWaitingApi(accessToken, boothId);
    trackEvent({
      action: 'WAITING_REGISTER',
      targetType: 'BOOTH',
      targetId: String(boothId),
    });
    await refreshAll();
  }

  async function cancelWaiting(waiting: DecoratedWaiting) {
    if (!accessToken) {
      throw new Error('로그인이 필요합니다.');
    }

    await cancelWaitingApi(accessToken, waiting.waiting_id);
    trackEvent({
      action: 'WAITING_CANCEL',
      targetType: 'BOOTH',
      targetId: waiting.boothId ? String(waiting.boothId) : undefined,
      metadata: {
        waiting_id: waiting.waiting_id,
        booth_name: waiting.booth_name,
      },
    });
    setState((current) => ({
      ...current,
      history: [historyEntry(waiting, 'CANCELED'), ...current.history].slice(0, 30),
    }));
    await refreshAll();
  }

  async function postponeWaiting(waiting: DecoratedWaiting) {
    if (!accessToken) {
      throw new Error('로그인이 필요합니다.');
    }

    await postponeWaitingApi(accessToken, waiting.waiting_id);
    await refreshAll();
  }

  async function exitWaiting(waiting: DecoratedWaiting) {
    if (!accessToken) {
      throw new Error('로그인이 필요합니다.');
    }

    await exitWaitingApi(accessToken, waiting.waiting_id);
    trackEvent({
      action: 'WAITING_COMPLETE',
      targetType: 'BOOTH',
      targetId: waiting.boothId ? String(waiting.boothId) : undefined,
      metadata: {
        waiting_id: waiting.waiting_id,
        booth_name: waiting.booth_name,
      },
    });
    setState((current) => ({
      ...current,
      history: [historyEntry(waiting, 'EXITED'), ...current.history].slice(0, 30),
    }));
    await refreshAll();
  }

  async function scanQr(qrCode: string) {
    if (!accessToken) {
      throw new Error('로그인이 필요합니다.');
    }

    await scanQrApi(accessToken, qrCode);
    trackEvent({
      action: 'MAP_INTERACTION',
      targetType: 'MAP',
      targetId: 'qr-scan',
      metadata: {
        qr_scan: true,
      },
    });
    await refreshAll();
  }

  const currentExperience =
    state.waitings.find((waiting) => waiting.status === 'ENTERED') ?? null;

  const queueWaitings = state.waitings.filter((waiting) => waiting.status !== 'ENTERED');

  const selectedBooth =
    state.booths.find((booth) => booth.boothId === state.selectedBoothId) ?? null;

  const value: AppDataContextValue = {
    ...state,
    currentExperience,
    queueWaitings,
    selectedBooth,
    selectBooth: (boothId: number | null) => {
      setState((current) => ({
        ...current,
        selectedBoothId: boothId,
      }));
    },
    refreshAll: async () => {
      await refreshAll();
    },
    getBoothDetail: getBoothDetailById,
    createWaiting,
    cancelWaiting,
    postponeWaiting,
    exitWaiting,
    scanQr,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  return context;
}
