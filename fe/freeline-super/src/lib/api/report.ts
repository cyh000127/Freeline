import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EventSummaryDto {
  totalVisitors: number;
  totalRegistrations: number;
  avgWaitingSeconds: number;
  overallDropoutRate: number;
  peakHour: string | null;
}

export interface BoothPerformanceDto {
  boothId: number;
  boothName: string;
  viewCount: number;
  registerCount: number;
  dropoutCount: number;
  conversionRate: number;
  dropoutRate: number;
}

export interface HourlyTrafficDto {
  datetimeHour: string;
  activeUserCount: number;
  registerCount: number;
}

export interface VisitorPathDto {
  pathString: string;
  visitorCount: number;
}

export interface ProblemSpotDto {
  issueType: string;
  targetId: string;
  targetName: string;
  severity: string;
  issueMetric: number;
  description: string;
}

export interface ReportResponseDto {
  summary: EventSummaryDto;
  boothPerformances: BoothPerformanceDto[];
  hourlyTraffics: HourlyTrafficDto[];
  visitorPaths: VisitorPathDto[];
  problemSpots: ProblemSpotDto[];
}

export interface ReportStatusDto {
  eventId: number;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const reportApi = {
  getEventReport: (eventId: string | number) =>
    api.get<ApiResponse<ReportResponseDto>>(`/v1/reports/events/${eventId}`),

  generateReport: (eventId: string | number) =>
    api.post<ApiResponse<ReportStatusDto>>(`/v1/reports/events/${eventId}/generate`),

  getReportStatus: (eventId: string | number) =>
    api.get<ApiResponse<ReportStatusDto>>(`/v1/reports/events/${eventId}/status`),
};
