export type SessionState = {
  isReady: boolean;
  hasSeenOnboarding: boolean;
  entryCode: string | null;
  eventId: number | null;
  visitorId: number | null;
  accessToken: string | null;
  refreshToken: string | null;
  nickname: string;
  requiredAgreed: boolean;
  marketingAgreed: boolean;
};

export type PersistedSession = Omit<SessionState, 'isReady'>;
