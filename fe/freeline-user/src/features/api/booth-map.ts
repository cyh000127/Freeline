import { getData, withAccessToken } from '@/lib/request';

export type BoothMapArea = {
  areaId: number;
  boothId: number;
  boothName: string;
  locationCode: string;
  waitingCount: number;
  isEmergencyClosed: boolean;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
};

export type BoothMapRes = {
  eventId: number;
  eventMapId: number;
  mapImageUrl: string | null;
  booths: BoothMapArea[];
};

export async function fetchVisitorBoothMap(accessToken?: string | null) {
  return getData<BoothMapRes>('/boothmaps/visitors/me', withAccessToken(accessToken));
}
