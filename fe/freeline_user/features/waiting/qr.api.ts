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
// NOTE:
// 현재는 visitor 인증이 아직 없어 visitorId를 body로 전달한다. ((api 명세서 참조))
// 이후 JWT 인증 적용 시 access token 기반으로 변경 예정.
