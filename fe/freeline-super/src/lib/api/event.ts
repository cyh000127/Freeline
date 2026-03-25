import { api } from '../api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Event {
  eventId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  openTime: string;
  closeTime: string;
  locationAddress: string;
  status: 'DRAFT' | 'READY' | 'OPEN' | 'CLOSED' | 'CANCELED';
  thumbnailImageUrl?: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  hasNext: boolean;
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
  isFirst: boolean;
  isLast: boolean;
}

export const eventApi = {
  // 전체 행사 목록 조회 (페이지네이션 적용됨, 기본값 설정)
  getEvents: (page = 0, size = 10) => api.get<ApiResponse<PaginatedResponse<Event>>>(`/v1/events?page=${page}&size=${size}`),
  
  // 행사 상세 조회
  getEvent: (id: number | string) => api.get<ApiResponse<Event>>(`/v1/events/${id}`),
  
  // 행사 삭제
  deleteEvent: (id: number | string) => api.delete<ApiResponse<any>>(`/v1/events/${id}`),

  // 행사 썸네일 업로드
  uploadThumbnail: (eventId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>(`/v1/events/${eventId}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 행사 정책 조회
  getPolicy: (eventId: number | string) =>
    api.get<ApiResponse<any>>(`/v1/events/${eventId}/policies`),

  // 행사 정책 수정
  updatePolicy: (eventId: number | string, payload: {
    default_stay_sec: number;
    default_max_waiting: number;
    default_call_count: number;
    default_call_ttl: number;
    default_defer_limit: number;
  }) => api.put<ApiResponse<any>>(`/v1/events/${eventId}/policies`, payload),

  // 특정 행사 부스 목록 조회
  getBooths: (eventId: number | string) => api.get<ApiResponse<any>>(`/v1/events/${eventId}/booths`),

  // 부스 및 부스 관리자 통합 CSV 일괄 등록
  onboardBooths: (eventId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>(`/v1/events/${eventId}/booths/csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
