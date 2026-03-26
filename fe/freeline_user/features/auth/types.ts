export interface EntryCodeVerifyRequest {
  entryCode: string;
}

export interface EntryCodeVerifyData {
  accessToken: string;
  refreshToken: string | null;
  role: 'VISITOR' | 'BOOTH_ADMIN' | 'EVENT_ADMIN';
  boothId: number | null;
  isPasswordChangeRequired?: boolean;
  company?: string | null;
  boothName?: string | null;
}
