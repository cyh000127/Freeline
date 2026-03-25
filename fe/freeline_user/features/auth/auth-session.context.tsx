import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/api/axios';
import {
  clearAuthSessionStorage,
  loadAuthSession,
  saveAuthSession,
  type PersistedAuthSession,
} from '@/features/auth/auth-session.storage';

type EntryAuthApiResponse = {
  success: boolean;
  data: {
    visitorId: number;
    accessToken: string;
    accountStatus: string;
    queueStatus: string;
  };
};

type AuthSessionState = PersistedAuthSession;

type CompleteRegistrationParams = {
  requiredAgreed: boolean;
  marketingAgreed: boolean;
};

type AuthSessionContextValue = AuthSessionState & {
  isHydrating: boolean;
  authenticateEntryCode: (entryCode: string) => Promise<void>;
  setNickname: (nickname: string) => void;
  completeRegistration: (params: CompleteRegistrationParams) => void;
  clearSession: () => Promise<void>;
  reloadSession: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

const initialState: AuthSessionState = {
  entryCode: null,
  visitorId: null,
  accessToken: null,
  nickname: null,
  requiredAgreed: false,
  marketingAgreed: false,
  accountStatus: null,
  queueStatus: null,
};

async function authenticateEntryCodeRequest(entryCode: string) {
  const response = await api.post<EntryAuthApiResponse>(
    '/visitors/entry-code/authenticate',
    { entryCode },
  );

  const payload = response.data;

  if (!payload?.success || !payload?.data?.accessToken) {
    throw new Error('입장 코드 인증에 실패했습니다.');
  }

  return {
    visitorId: payload.data.visitorId,
    accessToken: payload.data.accessToken,
    accountStatus: payload.data.accountStatus,
    queueStatus: payload.data.queueStatus,
  };
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSessionState>(initialState);
  const [isHydrating, setIsHydrating] = useState(true);

  const persist = useCallback(async (next: AuthSessionState) => {
    setSession(next);
    await saveAuthSession(next);
  }, []);

  const reloadSession = useCallback(async () => {
    setIsHydrating(true);

    try {
      const stored = await loadAuthSession();
      setSession(stored ?? initialState);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    reloadSession();
  }, [reloadSession]);

  const authenticateEntryCode = useCallback(
    async (entryCode: string) => {
      const trimmed = entryCode.trim();

      if (!trimmed) {
        throw new Error('입장 코드를 입력해주세요.');
      }

      const result = await authenticateEntryCodeRequest(trimmed);

      const nextState: AuthSessionState = {
        ...session,
        entryCode: trimmed,
        visitorId: result.visitorId,
        accessToken: result.accessToken,
        accountStatus: result.accountStatus,
        queueStatus: result.queueStatus,
      };

      await persist(nextState);
    },
    [persist, session],
  );

  const setNickname = useCallback(
    async (nickname: string) => {
      const nextState: AuthSessionState = {
        ...session,
        nickname,
      };

      await persist(nextState);
    },
    [persist, session],
  );

  const completeRegistration = useCallback(
    async ({ requiredAgreed, marketingAgreed }: CompleteRegistrationParams) => {
      const nextState: AuthSessionState = {
        ...session,
        requiredAgreed,
        marketingAgreed,
      };

      await persist(nextState);
    },
    [persist, session],
  );

  const clearSession = useCallback(async () => {
    setSession(initialState);
    await clearAuthSessionStorage();
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      ...session,
      isHydrating,
      authenticateEntryCode,
      setNickname: (nickname: string) => {
        void setNickname(nickname);
      },
      completeRegistration: (params: CompleteRegistrationParams) => {
        void completeRegistration(params);
      },
      clearSession,
      reloadSession,
    }),
    [
      session,
      isHydrating,
      authenticateEntryCode,
      setNickname,
      completeRegistration,
      clearSession,
      reloadSession,
    ],
  );

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }

  return context;
}
