import { deleteOk, getData, patchData, postData, withAccessToken } from '@/lib/request';

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

export async function fetchMyWaitings(accessToken: string) {
  return getData<WaitingListResponse>('/visitors/me/waitings', withAccessToken(accessToken));
}

export async function createWaiting(accessToken: string, boothId: number) {
  return postData<WaitingMutationResponse>(
    `/booths/${boothId}/waitings`,
    undefined,
    withAccessToken(accessToken),
  );
}

export async function cancelWaiting(accessToken: string, waitingId: number) {
  await deleteOk(`/waitings/${waitingId}`, withAccessToken(accessToken));
}

export async function postponeWaiting(accessToken: string, waitingId: number) {
  return patchData<WaitingMutationResponse>(
    `/waitings/${waitingId}/postpone`,
    undefined,
    withAccessToken(accessToken),
  );
}

export async function exitWaiting(accessToken: string, waitingId: number) {
  return patchData<WaitingMutationResponse>(
    `/waitings/${waitingId}/exit`,
    undefined,
    withAccessToken(accessToken),
  );
}
