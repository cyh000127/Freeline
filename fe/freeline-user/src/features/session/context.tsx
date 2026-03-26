import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authenticateEntryCode as authenticateEntryCodeApi, logout as logoutApi } from '@/features/api/auth';
import { clearPushRegistrationCache } from '@/features/notifications/registration-cache';
import { fetchMyEventDetail } from '@/features/api/event';
import { usePushRegistration } from '@/features/notifications/register-push';
import { getUserIdFromToken } from '@/utils/jwt';
import { validateNickname } from '@/utils/nickname';
import { getEventProfile, parseEventIdFromEntryCode, toEventProfile } from '@/utils/event';
import { clearSessionStorage, emptySession, readSession, writeSession } from './storage';
import type { PersistedSession, SessionState } from './types';

type SessionContextValue = SessionState & {
  eventProfile: ReturnType<typeof getEventProfile> | null;
  authenticateEntryCode: (entryCode: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  saveNickname: (nickname: string) => Promise<void>;
  confirmProfile: () => Promise<void>;
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
  const [eventProfile, setEventProfile] = useState<ReturnType<typeof getEventProfile> | null>(null);

  usePushRegistration(session.visitorId);

  useEffect(() => {
    async function hydrate() {
      const stored = await readSession();
      setSession(toRuntimeState(stored));
    }

    void hydrate();
  }, []);

  useEffect(() => {
    if (!session.accessToken) {
      setEventProfile(session.eventId ? getEventProfile(session.eventId) : null);
      return;
    }

    let cancelled = false;

    async function hydrateEventProfile() {
      try {
        const event = await fetchMyEventDetail(session.accessToken as string);

        if (cancelled) {
          return;
        }

        setEventProfile(toEventProfile(event));
      } catch (error) {
        console.warn('행사 상세 조회 실패', error);

        if (cancelled) {
          return;
        }

        setEventProfile(session.eventId ? getEventProfile(session.eventId) : null);
      }
    }

    void hydrateEventProfile();

    return () => {
      cancelled = true;
    };
  }, [session.accessToken, session.eventId]);

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
      ...emptySession,
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
    const normalized = validateNickname(nickname);

    await persist({
      ...session,
      nickname: normalized,
    });
  }

  async function confirmProfile() {
    await persist({
      ...session,
      requiredAgreed: true,
      marketingAgreed: false,
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
    await clearPushRegistrationCache();
    setSession({
      ...emptySession,
      hasSeenOnboarding: true,
      isReady: true,
    });
    setEventProfile(null);
  }

  async function resetAll() {
    await clearSessionStorage();
    await clearPushRegistrationCache();
    setSession({
      ...emptySession,
      hasSeenOnboarding: true,
      isReady: true,
    });
    setEventProfile(null);
  }

  return (
    <SessionContext.Provider
      value={{
        ...session,
        eventProfile,
        authenticateEntryCode,
        completeOnboarding,
        saveNickname,
        confirmProfile,
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
