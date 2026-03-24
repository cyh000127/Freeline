import { api } from '@/api/axios';
import type {
  ApiResponse,
  WaitingListData,
  WaitingCreateData,
  WaitingPostponeData,
  WaitingExpectedTimeData,
  WaitingExitData,
} from './types';

function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  const result = response.data;

  if (!result.success || result.data === null) {
    throw new Error(result.error?.message || 'Request failed');
  }

  return result.data;
}

function ensureSuccess(response: { data: ApiResponse<null> }): void {
  const result = response.data;

  if (!result.success) {
    throw new Error(result.error?.message || 'Request failed');
  }
}

// 전체 대기 정보 가져오기
export const getMyWaitings = async (accessToken: string): Promise<WaitingListData> => {
  const response = await api.get<ApiResponse<WaitingListData>>('visitors/me/waitings', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return unwrapResponse(response);
};

// 대기 등록
export const createWaiting = async (
  accessToken: string,
  boothId: number,
): Promise<WaitingCreateData> => {
  const response = await api.post<ApiResponse<WaitingCreateData>>(
    `booths/${boothId}/waitings`,
    undefined,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return unwrapResponse(response);
};

//대기 미루기
export const postponeWaiting = async (
  accessToken: string,
  waitingId: number,
): Promise<WaitingPostponeData> => {
  const response = await api.patch<ApiResponse<WaitingPostponeData>>(
    `waitings/${waitingId}/postpone`,
    undefined,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return unwrapResponse(response);
};

// 대기 취소
export const cancelWaiting = async (
  accessToken: string,
  waitingId: number,
): Promise<void> => {
  const response = await api.delete<ApiResponse<null>>(`waitings/${waitingId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  ensureSuccess(response);
};

// 부스 예상 대기 시간 조회
export const getExpectedWaitingTime = async (
  accessToken: string,
  boothId: number,
): Promise<WaitingExpectedTimeData> => {
  const response = await api.get<ApiResponse<WaitingExpectedTimeData>>(
    `booths/${boothId}/waitings/expected-time`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return unwrapResponse(response);
};

// 이용 종료
export const exitWaiting = async (
  accessToken: string,
  waitingId: number,
): Promise<WaitingExitData> => {
  const response = await api.patch<ApiResponse<WaitingExitData>>(
    `waitings/${waitingId}/exit`,
    undefined,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return unwrapResponse(response);
};
