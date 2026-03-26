import type { ApiResponse } from '@/types/api';
import { sanitizeErrorMessage } from '@/utils/error';

export function unwrap<T>(response: { data: ApiResponse<T> }) {
  const payload = response.data;

  if (!payload.success || payload.data == null) {
    throw new Error(
      sanitizeErrorMessage(payload.error?.message ?? payload.message, '요청 처리에 실패했습니다.'),
    );
  }

  return payload.data;
}

export function ensureOk(response: { data: ApiResponse<null> }) {
  const payload = response.data;

  if (!payload.success) {
    throw new Error(
      sanitizeErrorMessage(payload.error?.message ?? payload.message, '요청 처리에 실패했습니다.'),
    );
  }
}
