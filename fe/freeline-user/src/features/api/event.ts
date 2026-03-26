import { http } from '@/lib/http';
import { unwrap } from '@/lib/api';

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
  const response = await http.get('/visitors/me/event', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return unwrap<VisitorEventDetail>(response);
}
