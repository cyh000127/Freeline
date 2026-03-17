import React, { createContext, useContext, useState } from 'react';
import { MockWaitingItem, initialMockWaitings } from '../../mocks/qrMock';

type QRMockContextValue = {
  waitings: MockWaitingItem[];
  markVerified: (waitingId: string) => void;
  resetMock: () => void;
};

const QRMockContext = createContext<QRMockContextValue | null>(null);

export function QRMockProvider({ children }: { children: React.ReactNode }) {
  const [waitings, setWaitings] = useState(initialMockWaitings);

  const markVerified = (waitingId: string) => {
    setWaitings((prev) =>
      prev.map((item) =>
        item.waitingId === waitingId ? { ...item, verificationState: 'done' } : item,
      ),
    );
  };

  const resetMock = () => {
    setWaitings(initialMockWaitings);
  };

  return (
    <QRMockContext.Provider value={{ waitings, markVerified, resetMock }}>
      {children}
    </QRMockContext.Provider>
  );
}

export function useQRMock() {
  const ctx = useContext(QRMockContext);
  if (!ctx) {
    throw new Error('useQRMock must be used within QRMockProvider');
  }
  return ctx;
}
