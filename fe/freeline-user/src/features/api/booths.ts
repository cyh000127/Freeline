import { http } from '@/lib/http';
import { unwrap } from '@/lib/api';

export type BoothSummary = {
  boothId: number;
  name: string;
  locationCode: string;
  isEmergencyClosed: boolean;
  openTime: string;
  closeTime: string;
};

export type BoothGoods = {
  goodsId: number;
  name: string;
  imageUrl: string;
  isSoldOut: boolean;
};

export type BoothDetail = {
  boothId: number;
  name: string;
  locationCode: string;
  isEmergencyClosed: boolean;
  waitingCount: number;
  callCount: number;
  callValidSeconds: number;
  representativeImageUrl: string | null;
  boothImageUrls: string[];
  goods: BoothGoods[];
};

export type ExpectedTime = {
  booth_id: number;
  current_rank: number;
  estimated_minutes: number;
  avg_stay_time: number;
};

function authHeaders(accessToken?: string | null) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export async function fetchBooths(eventId: number, accessToken?: string | null) {
  const response = await http.get(`/booths/events/${eventId}`, {
    headers: authHeaders(accessToken),
  });

  return unwrap<BoothSummary[]>(response);
}

export async function fetchBoothDetail(boothId: number, accessToken?: string | null) {
  const response = await http.get(`/booths/${boothId}`, {
    headers: authHeaders(accessToken),
  });

  return unwrap<BoothDetail>(response);
}

export async function fetchExpectedTime(boothId: number, accessToken?: string | null) {
  const response = await http.get(`/booths/${boothId}/waitings/expected-time`, {
    headers: authHeaders(accessToken),
  });

  return unwrap<ExpectedTime>(response);
}
