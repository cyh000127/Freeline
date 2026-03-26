import { postOk, withAccessToken } from '@/lib/request';
import type { ActionLogBulkRequest } from './tracking.types';

export async function sendActionLogs(
  accessToken: string,
  request: ActionLogBulkRequest,
): Promise<void> {
  await postOk('/logs/actions', request, {
    ...withAccessToken(accessToken),
    timeout: 10000,
  });
}
