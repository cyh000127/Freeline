import { api } from '@/api/axios';
import type { ApiResponse } from '@/features/waiting/types';
import type { EntryCodeVerifyData, EntryCodeVerifyRequest } from './types';

function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  const { success, data, error } = response.data;

  if (!success || data == null) {
    throw new Error(error?.message ?? '요청 처리에 실패했습니다.');
  }

  return data;
}

// 이벤트 최초 입장 인증
export const verifyEntryCode = async (
  payload: EntryCodeVerifyRequest,
): Promise<EntryCodeVerifyData> => {
  const response = await api.post<ApiResponse<EntryCodeVerifyData>>(
    'auth/visitors/entry-code/authenticate',
    payload,
  );

  return unwrapResponse(response);
};
