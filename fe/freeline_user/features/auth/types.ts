export type AccountStatus = 'UNACTIVE' | 'ACTIVE';

export type QueueStatus = 'FREE' | 'FRONT_QUEUE_OCCUPIED' | 'IN_BOOTH';

export interface EntryCodeVerifyRequest {
  entryCode: string;
}

export interface EntryCodeVerifyData {
  accessToken: string;
  refreshToken: string | null;
  role: 'VISITOR' | 'BOOTH_ADMIN' | 'EVENT_ADMIN';
  boothId: number | null;
}
