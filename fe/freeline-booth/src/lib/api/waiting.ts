import { api } from "../api";

export interface WaitingInfo {
  waitingId: number;
  waitingNumber: number;
  visitorName: string;
  status: 'REGISTERED' | 'WAITING' | 'CALLED' | 'ENTERED' | 'CANCELLED' | 'EXITED';
  deferCount?: number;
  arrivalChecked?: boolean;
  calledAt?: string;
  registeredAt?: string;
  enteredAt?: string;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    booth: {
      boothId: number;
      boothName: string;
      locationCode: string;
      emergencyClosed: boolean;
    };
    summary: {
      totalActiveCount: number;
      waitingCount: number;
      frontQueueCount: number;
      inUseCount: number;
      blockedByOtherBoothCount: number;
    };
    frontQueue: WaitingInfo[];
  };
}

// Swagger for /v1/booths/me/queue shows snake_case
export interface QueueResponse {
  success: boolean;
  message: string;
  data: {
    booth_id: number;
    total_waiting_count: number;
    queue_list: Array<{
      waiting_id: number;
      waiting_number: number;
      visitor_name: string | null;
      status: any;
      defer_count: number;
      called_at: string | null;
      registered_at?: string;
    }>;
  };
}

export const waitingApi = {
  // 대시보드 정보 조회 (요약 + 대기열) - CamelCase 사양
  getDashboard: async (boothId: number) => {
    const response = await api.get(`/v1/booth-managers/booths/${boothId}/dashboard`);
    return response.data;
  },

  // 대기열 전체 목록 조회 (실시간 부스 대기열 현황) - SnakeCase 사양 대응
  getQueue: async () => {
    const response = await api.get('/v1/booths/me/queue');
    const data = response.data;
    
    // Convert SnakeCase to CamelCase for frontend consistency
    if (data.success && data.data && data.data.queue_list) {
      data.data.queueList = data.data.queue_list.map((w: any) => ({
        waitingId: w.waiting_id,
        waitingNumber: w.waiting_number,
        visitorName: w.visitor_name || "익명",
        status: w.status,
        deferCount: w.defer_count,
        arrivalChecked: w.status === 'ENTERED' || w.status === 'EXITED' || w.status === 'REGISTERED' || !!w.arrived_at || !!w.arrival_at || !!w.is_arrived || !!w.is_arrival_checked,
        calledAt: w.called_at,
        registeredAt: w.registered_at || w.called_at, // Fallback
        enteredAt: w.entered_at,
        arrivedAt: w.arrived_at || w.arrival_at
      }));
      data.data.totalWaitingCount = data.data.total_waiting_count;
    }
    
    return data;
  },

  // 다음 대기자 호출 (부스 매니저 상세 경로)
  callNext: async (boothId: number) => {
    const response = await api.post(`/v1/booth-managers/booths/${boothId}/waitings/call-next`);
    return response.data;
  },

  // 입장 처리 (부스 매니저 상세 경로)
  admitWaiting: async (boothId: number, waitingId: number) => {
    const response = await api.patch(`/v1/booth-managers/booths/${boothId}/waitings/${waitingId}/admit`);
    return response.data;
  },

  // 관리자 대기 취소 (부스 매니저 상세 경로)
  cancelWaiting: async (boothId: number, waitingId: number) => {
    const response = await api.delete(`/v1/booth-managers/booths/${boothId}/waitings/${waitingId}`);
    return response.data;
  },

  // 이용 종료 처리 (부스 매니저 상세 경로)
  exitWaiting: async (boothId: number, waitingId: number) => {
    const response = await api.patch(`/v1/booth-managers/booths/${boothId}/waitings/${waitingId}/exit`);
    return response.data;
  },

  // 대기 순서 미루기 (기존 경로 유지)
  postponeWaiting: async (waitingId: number) => {
    const response = await api.patch(`/v1/waitings/${waitingId}/postpone`);
    return response.data;
  },

  // 예상 대기 시간 조회
  getExpectedWaitTime: async (boothId: number) => {
    const response = await api.get(`/v1/booths/${boothId}/waitings/expected-time`);
    return response.data;
  },

  // SSE 구독 엔드포인트 URL
  getSubscribeUrl: (boothId: number) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://j14a207.p.ssafy.io/api';
    return `${baseURL}/v1/booth-managers/booths/${boothId}/subscribe`;
  }
};
