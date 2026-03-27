import { api } from '../api';

export interface Goods {
  goodsId: number;
  name: string;
  imageUrl: string;
  isSoldOut: boolean;
}

export interface GoodsResponse {
  success: boolean;
  message: string;
  data: Goods[];
  error: any | null;
  timestamp: string;
}

export const getGoodsList = async (boothId: number): Promise<GoodsResponse> => {
  const response = await api.get(`/v1/goods/booths/${boothId}`);
  return response.data;
};

export const createGoods = async (
  boothId: number,
  data: { name: string; imageFile: File }
): Promise<{ success: boolean; data: Goods }> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('imageFile', data.imageFile);

  const response = await api.post(`/v1/goods/booths/${boothId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateGoodsStatus = async (
  goodsId: number,
  isSoldOut: boolean
): Promise<{ isSoldOut: boolean }> => {
  const response = await api.patch(`/v1/goods/${goodsId}/status`, { isSoldOut });
  return response.data;
};

export const deleteGoods = async (goodsId: number): Promise<void> => {
  await api.delete(`/v1/goods/${goodsId}`);
};

