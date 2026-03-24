import { api } from '@/api/axios';
import type { ApiResponse } from '@/features/waiting/types';
import type { BoothDetailData, BoothGoodsItem, EventBoothItem } from './types';

function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  const { success, data, error } = response.data;

  if (!success || data == null) {
    throw new Error(error?.message ?? '요청 처리에 실패했습니다.');
  }

  return data;
}

// 전체 부스 조회
export const getEventBooths = async (
  accessToken: string,
  eventId: number,
): Promise<EventBoothItem[]> => {
  const response = await api.get<ApiResponse<EventBoothItem[]>>(
    `booths/events/${eventId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return unwrapResponse(response);
};

// 부스 상세 조회
export const getBoothDetail = async (
  accessToken: string,
  boothId: number,
): Promise<BoothDetailData> => {
  const response = await api.get<ApiResponse<BoothDetailData>>(`booths/${boothId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return unwrapResponse(response);
};

// 굿즈 목록 조회
export const getBoothGoods = async (
  accessToken: string,
  boothId: number,
): Promise<BoothGoodsItem[]> => {
  const response = await api.get<ApiResponse<BoothGoodsItem[]>>(
    `goods/booths/${boothId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return unwrapResponse(response);
};
