import { api } from '@/api/axios';
import type { ApiResponse, QrScanData, QrScanRequest } from './types';

function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  const { success, data, error } = response.data;

  if (!success || data == null) {
    throw new Error(error?.message ?? '요청 처리에 실패했습니다.');
  }

  return data;
}

// 사용자 QR 스캔 등록
export const scanQr = async (
  accessToken: string,
  payload: QrScanRequest,
): Promise<QrScanData> => {
  const response = await api.post<ApiResponse<QrScanData>>('qr/scan', payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return unwrapResponse(response);
};
