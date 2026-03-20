export type VisitorQueueStatus = 'FREE' | 'FRONT_QUEUE_OCCUPIED' | 'IN_BOOTH';

export type WaitingStatus = 'WAITING' | 'CALLED' | 'REGISTERED' | 'ENTERED';

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
