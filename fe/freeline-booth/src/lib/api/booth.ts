import { api } from '../api';

export interface BoothUpdateRequest {
  name: string;
  locationCode: string;
  openTime: string;
  closeTime: string;
}

export interface BoothResponse {
  success: boolean;
  data: {
    boothId: number;
    name: string;
    locationCode: string;
    openTime: string;
    closeTime: string;
    // Add other fields if necessary
  };
}

export const updateBooth = async (
  boothId: number,
  data: BoothUpdateRequest
): Promise<BoothResponse> => {
  const response = await api.patch(`/booths/${boothId}`, data);
  return response.data;
};

// Also adding a getter if needed for initial form state
export const getBoothInfo = async (boothId: number): Promise<BoothResponse> => {
  const response = await api.get(`/booths/${boothId}`);
  return response.data;
};
