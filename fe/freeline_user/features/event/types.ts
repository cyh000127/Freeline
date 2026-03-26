export interface EventDetail {
  id: number;
  name: string;
  startDate: string; // e.g. "2026-03-06"
  endDate: string; // e.g. "2026-03-08"
  description?: string;
  imageUrl?: string;
}
