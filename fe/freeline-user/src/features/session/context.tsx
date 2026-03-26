import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authenticateEntryCode as authenticateEntryCodeApi, logout as logoutApi } from '@/features/api/auth';
import { usePushRegistration } from '@/features/notifications/register-push';
import { getUserIdFromToken } from '@/utils/jwt';
import { getEventProfile, parseEventIdFromEntryCode } from '@/utils/event';
import { clearSessionStorage, emptySession, readSession, writeSession } from './storage';
import type { PersistedSession, SessionState } from './types';

type SessionContextValue = SessionState & {
  eventProfile: ReturnType<typeof getEventProfile> | null;
  authenticateEntryCode: (entryCode: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  saveNickname: (nickname: string) => Promise<void>;
  saveAgreements: (requiredAgreed: boolean, marketingAgreed: boolean) => Promise<void>;
  logout: () => Promise<void>;
  resetAll: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function toRuntimeState(session: PersistedSession): SessionState {
  return {
    ...session,
    isReady: true,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({
    ...emptySession,
    isReady: false,
  });

  usePushRegistration(session.visitorId);

  useEffect(() => {
    async function hydrate() {
      const stored = await readSession();
      setSession(toRuntimeState(stored));
    }

    void hydrate();
  }, []);

  async function persist(next: PersistedSession) {
    await writeSession(next);
    setSession(toRuntimeState(next));
  }

  async function authenticateEntryCode(entryCode: string) {
    const trimmed = entryCode.trim();

    if (!trimmed) {
      throw new Error('입장 코드를 입력해주세요.');
    }

    const response = await authenticateEntryCodeApi(trimmed);
    const eventId = parseEventIdFromEntryCode(trimmed);
    const visitorId = getUserIdFromToken(response.accessToken);

    await persist({
      ...session,
      hasSeenOnboarding: true,
      entryCode: trimmed,
      eventId,
      visitorId,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
  }

  async function completeOnboarding() {
    await persist({
      ...session,
      hasSeenOnboarding: true,
    });
  }

  async function saveNickname(nickname: string) {
    await persist({
      ...session,
      nickname: nickname.trim(),
    });
  }

  async function saveAgreements(requiredAgreed: boolean, marketingAgreed: boolean) {
    await persist({
      ...session,
      requiredAgreed,
      marketingAgreed,
    });
  }

  async function logout() {
    if (session.accessToken) {
      try {
        await logoutApi(session.accessToken);
      } catch (error) {
        console.warn('로그아웃 API 실패', error);
      }
    }

    await clearSessionStorage();
    setSession({
      ...emptySession,
      isReady: true,
    });
  }

  async function resetAll() {
    await clearSessionStorage();
    setSession({
      ...emptySession,
      isReady: true,
    });
  }

  return (
    <SessionContext.Provider
      value={{
        ...session,
        eventProfile: session.eventId ? getEventProfile(session.eventId) : null,
        authenticateEntryCode,
        completeOnboarding,
        saveNickname,
        saveAgreements,
        logout,
        resetAll,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
}
