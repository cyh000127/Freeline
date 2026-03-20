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
  error: any;
  timestamp: string;
}

export const getQR = async (boothId: number): Promise<QRResponse> => {
  const response = await api.get(`/qr/booths/${boothId}`);
  return response.data;
};

export const generateQR = async (boothId: number): Promise<QRResponse> => {
  const response = await api.post(`/qr/booths/${boothId}`);
  return response.data;
};

export const reissueQR = async (boothId: number): Promise<QRResponse> => {
  const response = await api.patch(`/qr/booths/${boothId}/reissue`);
  return response.data;
};
