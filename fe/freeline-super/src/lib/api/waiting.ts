import { api } from "@/lib/api";

export interface WaitingInfo {
  waitingId: number;
  waitingNumber: number;
  visitorName: string;
  status: "REGISTERED" | "WAITING" | "CALLED" | "ENTERED" | "CANCELLED" | "EXITED";
  deferCount?: number;
  arrivalChecked?: boolean;
  calledAt?: string | null;
  registeredAt?: string | null;
  enteredAt?: string | null;
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
      status: string;
      defer_count: number;
      called_at: string | null;
      registered_at?: string | null;
      entered_at?: string | null;
      arrived_at?: string | null;
    }>;
    queueList?: WaitingInfo[];
    totalWaitingCount?: number;
  };
}

export const superWaitingApi = {
  getDashboard: async (boothId: number) => {
    const response = await api.get(`/v1/booth-managers/booths/${boothId}/dashboard`);
    return response.data as DashboardResponse;
  },

  getQueue: async (boothId: number) => {
    const response = await api.get(`/v1/booths/me/queue`, { params: { boothId } });
    const data = response.data as QueueResponse;

    if (data.success && data.data?.queue_list) {
      data.data.queueList = data.data.queue_list.map((item) => ({
        waitingId: item.waiting_id,
        waitingNumber: item.waiting_number,
        visitorName: item.visitor_name || "익명",
        status: item.status as WaitingInfo["status"],
        deferCount: item.defer_count,
        arrivalChecked:
          item.status === "ENTERED" ||
          item.status === "EXITED" ||
          item.status === "REGISTERED" ||
          Boolean(item.arrived_at),
        calledAt: item.called_at,
        registeredAt: item.registered_at || item.called_at,
        enteredAt: item.entered_at,
      }));
      data.data.totalWaitingCount = data.data.total_waiting_count;
    }

    return data;
  },

  callNext: async (boothId: number) => {
    const response = await api.post(`/v1/booth-managers/booths/${boothId}/waitings/call-next`);
    return response.data;
  },

  admitWaiting: async (boothId: number, waitingId: number) => {
    const response = await api.patch(`/v1/booth-managers/booths/${boothId}/waitings/${waitingId}/admit`);
    return response.data;
  },

  cancelWaiting: async (boothId: number, waitingId: number) => {
    const response = await api.delete(`/v1/booth-managers/booths/${boothId}/waitings/${waitingId}`);
    return response.data;
  },

  exitWaiting: async (boothId: number, waitingId: number) => {
    const response = await api.patch(`/v1/booth-managers/booths/${boothId}/waitings/${waitingId}/exit`);
    return response.data;
  },
};
