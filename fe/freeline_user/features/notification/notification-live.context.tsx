import React, { createContext, useContext, useMemo, useState } from 'react';

type NotificationLiveContextValue = {
  refreshKey: number;
  notifyIncoming: () => void;
};

const NotificationLiveContext = createContext<NotificationLiveContextValue | null>(null);

export function NotificationLiveProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const value = useMemo(
    () => ({
      refreshKey,
      notifyIncoming: () => setRefreshKey((prev) => prev + 1),
    }),
    [refreshKey],
  );

  return (
    <NotificationLiveContext.Provider value={value}>
      {children}
    </NotificationLiveContext.Provider>
  );
}

export function useNotificationLive() {
  const context = useContext(NotificationLiveContext);

  if (!context) {
    throw new Error('useNotificationLive must be used within NotificationLiveProvider');
  }

  return context;
}
