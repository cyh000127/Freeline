import { api } from '@/api/axios';
import type { ApiResponse, WaitingListData } from './types';

export const getMyWaitings = async (accessToken: string): Promise<WaitingListData> => {
  const response = await api.get<ApiResponse<WaitingListData>>('visitors/me/waitings', {
    headers: { Authorization: 'Bearer ${accessToken}' },
  });

  const result = response.data;

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to load waiting list');
  }

  return result.data;
};
