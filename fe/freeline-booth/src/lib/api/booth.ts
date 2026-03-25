import { api } from '../api';

export interface BoothImage {
  boothImageId: number;
  boothId: number;
  imageUri: string;
  isRepresentative: boolean;
}

export interface BoothUpdateRequest {
  name: string;
  locationCode: string; // Changed back to locationCode
  openTime: string;
  closeTime: string;
}

export interface BoothResponse {
  success: boolean;
  data: {
    boothId: number;
    eventId: number;
    name: string;
    locationCode: string;
    openTime: string;
    closeTime: string;
    representativeImageUrl?: string;
    boothImageUrls?: string[];
  };
}

const formatTime = (time: string) => {
  if (!time) return "10:00";
  // The backend seems to expect HH:mm based on the Image 3 example
  return time.substring(0, 5);
};

export const updateBooth = async (
  boothId: number,
  data: BoothUpdateRequest
): Promise<BoothResponse> => {
  const formattedData = {
    ...data,
    openTime: formatTime(data.openTime),
    closeTime: formatTime(data.closeTime),
  };
  const response = await api.patch(`/v1/booths/${boothId}`, formattedData);
  return response.data;
};

// Also adding a getter if needed for initial form state
export const getBoothInfo = async (boothId: number): Promise<BoothResponse> => {
  const response = await api.get(`/v1/booths/${boothId}`);
  return response.data;
};

export interface BoothPolicy {
  staySeconds: number;
  maxWaitingCount: number;
  callCount: number;
  callValidSeconds: number;
  deferLimit: number; // Changed from deleteLimit
}

export interface BoothPolicyResponse {
  success: boolean;
  data: BoothPolicy & { boothId: number };
}

export const getBoothPolicy = async (boothId: number): Promise<BoothPolicyResponse> => {
  // GET is /api/v1/{boothId}/policy (no 'booths' segment in Swagger for GET)
  const response = await api.get(`/v1/${boothId}/policy`);
  return response.data;
};

export const updateBoothPolicy = async (
  boothId: number,
  data: BoothPolicy
): Promise<BoothPolicyResponse> => {
  const response = await api.patch(`/v1/booths/${boothId}/policy`, data);
  return response.data;
};

export const uploadRepresentativeImage = async (
  boothId: number,
  file: File
): Promise<{ success: boolean; data: any }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/v1/booths/${boothId}/image/representative?representative=true`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadBoothImage = async (
  boothId: number,
  file: File
): Promise<{ success: boolean; data: any }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/v1/booths/${boothId}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getBoothImages = async (boothId: number): Promise<{ success: boolean; data: BoothImage[] }> => {
  // Trying both with/without 'booths' segment if one fails
  try {
    const response = await api.get(`/v1/booths/${boothId}/images`);
    return response.data;
  } catch {
    const response = await api.get(`/v1/${boothId}/images`);
    return response.data;
  }
};
