import { api } from "../api";

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

export interface ProblemSpotDto {
  issueType: string;
  targetId: string;
  targetName: string;
  severity: string;
  issueMetric: number;
  description: string;
}

export interface EventSummaryDto {
  totalVisitors: number;
  totalRegistrations: number;
  avgWaitingSeconds: number;
  overallDropoutRate: number;
  peakHour: string | null;
}

export interface BoothReportResponseDto {
  boothPerformance: BoothPerformanceDto;
  hourlyTraffics: HourlyTrafficDto[];
  problemSpots: ProblemSpotDto[];
  eventSummary: EventSummaryDto | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const reportApi = {
  getMyBoothReport: () =>
    api.get<ApiResponse<BoothReportResponseDto>>("/v1/reports/booths/me"),
};
