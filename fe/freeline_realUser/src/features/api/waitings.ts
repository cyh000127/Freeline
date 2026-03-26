import { ensureOk, unwrap } from '@/lib/api';
import { http } from '@/lib/http';

export type WaitingStatus =
  | 'WAITING'
  | 'CALLED'
  | 'REGISTERED'
  | 'ENTERED'
  | 'EXITED'
  | 'EXPIRED'
  | 'CANCELED';

export type QueueStatus = 'FREE' | 'FRONT_QUEUE_OCCUPIED' | 'IN_BOOTH';

export type WaitingItem = {
  waiting_id: number;
  booth_name: string;
  status: WaitingStatus;
  my_rank: number;
  postpone_available: boolean;
};

export type WaitingListResponse = {
  visitor_queue_status: QueueStatus;
  waitings: WaitingItem[];
};

export type WaitingMutationResponse = {
  waiting_id: number;
  waiting_num?: number;
  current_rank?: number;
  status?: WaitingStatus;
  visitor_queue_status?: QueueStatus;
  new_rank?: number;
  remaining_postpone_count?: number;
  exited_at?: string;
};

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchMyWaitings(accessToken: string) {
  const response = await http.get('/visitors/me/waitings', {
    headers: authHeaders(accessToken),
  });

  return unwrap<WaitingListResponse>(response);
}

export async function createWaiting(accessToken: string, boothId: number) {
  const response = await http.post(`/booths/${boothId}/waitings`, undefined, {
    headers: authHeaders(accessToken),
  });

  return unwrap<WaitingMutationResponse>(response);
}

export async function cancelWaiting(accessToken: string, waitingId: number) {
  const response = await http.delete(`/waitings/${waitingId}`, {
    headers: authHeaders(accessToken),
  });

  ensureOk(response);
}

export async function postponeWaiting(accessToken: string, waitingId: number) {
  const response = await http.patch(`/waitings/${waitingId}/postpone`, undefined, {
    headers: authHeaders(accessToken),
  });

  return unwrap<WaitingMutationResponse>(response);
}

export async function exitWaiting(accessToken: string, waitingId: number) {
  const response = await http.patch(`/waitings/${waitingId}/exit`, undefined, {
    headers: authHeaders(accessToken),
  });

  return unwrap<WaitingMutationResponse>(response);
}
