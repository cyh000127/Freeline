import { api } from '../api';

export interface QRData {
  qrId: number;
  boothId: number;
  purpose: string;
  qrCode: string;
  issuedAt: string;
  expiresAt: string;
  status: string;
}

export interface QRResponse {
  success: boolean;
  data: QRData;
  error?: any;
}

export const getQR = async (boothId: number): Promise<QRResponse> => {
  const response = await api.get(`/v1/qr/booths/${boothId}`);
  return response.data;
};

export const generateQR = async (boothId: number): Promise<QRResponse> => {
  const response = await api.post(`/v1/qr/booths/${boothId}`);
  return response.data;
};

export const reissueQR = async (boothId: number): Promise<QRResponse> => {
  const response = await api.patch(`/v1/qr/booths/${boothId}/reissue`);
  return response.data;
};
