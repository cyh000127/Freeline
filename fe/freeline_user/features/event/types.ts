export interface EventDetail {
  eventId: number;
  eventAdminId: number;
  name: string;
  description: string | null;
  authCode: string | null;
  startDate: string;
  endDate: string;
  openTime: string;
  closeTime: string;
  locationAddress: string | null;
  thumbnailImageUrl: string | null;
  mapImageUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
