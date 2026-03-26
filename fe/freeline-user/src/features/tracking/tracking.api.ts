import { http } from '@/lib/http';
import type { ActionLogBulkRequest } from './tracking.types';

export async function sendActionLogs(
  accessToken: string,
  request: ActionLogBulkRequest,
): Promise<void> {
  await http.post('/logs/actions', request, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 10000,
  });
}
