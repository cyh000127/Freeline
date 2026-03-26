import type { BoothDetail, BoothSummary } from '@/features/api/booths';
import type { QueueStatus, WaitingItem, WaitingStatus } from '@/features/api/waitings';

export type DecoratedWaiting = WaitingItem & {
  boothId: number | null;
  locationCode: string | null;
  estimatedMinutes: number | null;
  boothDetail?: BoothDetail;
};

export type WaitingHistoryItem = {
  waitingId: number;
  boothName: string;
  boothId: number | null;
  status: WaitingStatus;
  timestamp: string;
};

export type AppDataState = {
  isLoading: boolean;
  isRefreshing: boolean;
  lastError: string | null;
  booths: BoothSummary[];
  boothDetails: Record<number, BoothDetail>;
  waitings: DecoratedWaiting[];
  queueStatus: QueueStatus;
  history: WaitingHistoryItem[];
  selectedBoothId: number | null;
};
