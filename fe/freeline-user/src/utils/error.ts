import { isAxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

const NETWORK_ERROR_MESSAGE = '네트워크 연결을 확인한 뒤 다시 시도해주세요.';
const TIMEOUT_ERROR_MESSAGE = '응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.';

export function sanitizeErrorMessage(message: string | null | undefined, fallback: string) {
  const normalized = message?.trim();

  if (!normalized) {
    return fallback;
  }

  if (/^Request failed with status code \d+$/i.test(normalized)) {
    return fallback;
  }

  if (/^Network Error$/i.test(normalized)) {
    return NETWORK_ERROR_MESSAGE;
  }

  return normalized;
}

export function toUserErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiResponse<unknown>>(error)) {
    if (error.code === 'ECONNABORTED') {
      return TIMEOUT_ERROR_MESSAGE;
    }

    const payload = error.response?.data;
    const serverMessage = payload?.error?.message ?? payload?.message;

    return sanitizeErrorMessage(serverMessage ?? error.message, fallback);
  }

  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message, fallback);
  }

  return fallback;
}
