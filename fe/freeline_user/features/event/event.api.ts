import { api } from '@/api/axios';
import type { ApiResponse } from '@/features/waiting/types';
import type { EventDetail } from './types';

function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  const { success, data, error } = response.data;

  if (!success || data == null) {
    throw new Error(error?.message ?? '요청 처리에 실패했습니다.');
  }

  return data;
}

export const getEventDetail = async (
  accessToken: string,
  options?: { includeBooths?: boolean },
): Promise<EventDetail> => {
  const response = await api.get<ApiResponse<EventDetail>>('visitors/me/event', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      includeBooths: options?.includeBooths ?? false,
    },
  });

  return unwrapResponse(response);
};
