import { api } from '@/api/axios';
import type { ActionLogBulkRequest, ActionLogBulkResponse } from './tracking.types';

export const sendActionLogs = async (
  accessToken: string,
  request: ActionLogBulkRequest,
): Promise<void> => {
  try {
    await api.post<ActionLogBulkResponse>('logs/actions', request, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
  } catch {
    throw new Error('Failed to send action logs');
  }
};
