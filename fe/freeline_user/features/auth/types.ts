export type AccountStatus = 'UNACTIVE' | 'ACTIVE';

export type QueueStatus = 'FREE' | 'FRONT_QUEUE_OCCUPIED' | 'IN_BOOTH';

export interface EntryCodeVerifyRequest {
  entryCode: string;
  userName: string;
}

export interface EntryCodeVerifyData {
  visitorId: number;
  accessToken: string;
  accountStatus: AccountStatus;
  queueStatus: QueueStatus;
}
