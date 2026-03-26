import { getData, withAccessToken } from '@/lib/request';

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

export async function fetchBooths(eventId: number, accessToken?: string | null) {
  return getData<BoothSummary[]>(`/booths/events/${eventId}`, withAccessToken(accessToken));
}

export async function fetchBoothDetail(boothId: number, accessToken?: string | null) {
  return getData<BoothDetail>(`/booths/${boothId}`, withAccessToken(accessToken));
}

export async function fetchExpectedTime(boothId: number, accessToken?: string | null) {
  return getData<ExpectedTime>(
    `/booths/${boothId}/waitings/expected-time`,
    withAccessToken(accessToken),
  );
}
