export type VisitorQueueStatus = 'FREE' | 'FRONT_QUEUE_OCCUPIED' | 'IN_BOOTH';
export type WaitingStatus =
  | 'WAITING'
  | 'CALLED'
  | 'REGISTERED'
  | 'ENTERED'
  | 'EXITED'
  | 'CANCELED'
  | 'AUTO_CANCELED';

export interface WaitingItem {
  waiting_id: number;
  booth_name: string;
  status: WaitingStatus;
  my_rank: number;
  postpone_available: boolean;
}

export interface WaitingListData {
  visitor_queue_status: VisitorQueueStatus;
  waitings: WaitingItem[];
}

export interface ApiError {
  status: string;
  message: string;
  method: string;
  requestUri: string;
  errors: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}

export interface WaitingCreateData {
  waiting_id: number;
  waiting_num: number;
  current_rank: number;
  status: WaitingStatus;
  visitor_queue_status: VisitorQueueStatus;
}

export interface WaitingPostponeData {
  waiting_id: number;
  new_rank: number;
  remaining_postpone_count: number;
}

export interface WaitingExpectedTimeData {
  booth_id: number;
  current_rank: number;
  estimated_minutes: number;
  avg_stay_time: number;
}

export interface WaitingExitData {
  waiting_id: number;
  status: 'EXITED';
  exited_at: string;
}

export interface QrScanRequest {
  qrCode: string;
}

export interface QrScanData {
  qrId: number;
  boothId: number;
  waitingId: number;
  visitorId: number;
  previousStatus: WaitingStatus;
  currentStatus: WaitingStatus;
  registeredAt: string;
}
