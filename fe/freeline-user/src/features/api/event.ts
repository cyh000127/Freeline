import { getData, withAccessToken } from '@/lib/request';

export type VisitorEventDetail = {
  eventId: number;
  name: string;
  startDate: string;
  endDate: string;
  openTime: string | null;
  closeTime: string | null;
  locationAddress: string | null;
  thumbnailImageUrl: string | null;
  mapImageUrl: string | null;
  status: string;
};

export async function fetchMyEventDetail(accessToken: string) {
  return getData<VisitorEventDetail>('/visitors/me/event', withAccessToken(accessToken));
}
