import { api } from '../api';

export interface Goods {
  goodsId: number;
  name: string;
  imageUrl: string;
  isSoldOut: boolean;
}

export interface GoodsResponse {
  success: boolean;
  data: Goods[];
}

export const getGoodsList = async (boothId: number): Promise<GoodsResponse> => {
  const response = await api.get(`/goods/booths/${boothId}`);
  return response.data;
};

export const createGoods = async (
  boothId: number,
  data: { name: string; imageUrl: string }
): Promise<Goods> => {
  const response = await api.post(`/goods/booths/${boothId}`, data);
  return response.data;
};

export const updateGoodsStatus = async (
  goodsId: number,
  isSoldOut: boolean
): Promise<{ isSoldOut: boolean }> => {
  const response = await api.patch(`/goods/${goodsId}/status`, { isSoldOut });
  return response.data;
};
