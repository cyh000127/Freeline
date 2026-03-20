import { ReservationStatus } from '@/types/reservation';

export const reservationStatusUI: Record<
  ReservationStatus,
  {
    statusLabel: string;
    statusTone: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
    actionLabel?: string;
    actionTone?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  }
> = {
  waiting: {
    statusLabel: '정상 대기 중',
    statusTone: 'blue',
  },
  called: {
    statusLabel: '호출됨',
    statusTone: 'yellow',
    actionLabel: 'QR 인증',
    actionTone: 'yellow',
  },
  registered: {
    statusLabel: '등록 완료',
    statusTone: 'green',
  },
  entered: {
    statusLabel: '입장 완료',
    statusTone: 'green',
  },
  completed: {
    statusLabel: '완료',
    statusTone: 'green',
  },
  canceled: {
    statusLabel: '예약 취소',
    statusTone: 'gray',
  },
  autocanceled: {
    statusLabel: '자동 취소',
    statusTone: 'red',
  },
};

export const isReservationFinished = (status: ReservationStatus) =>
  status === 'completed' || status === 'canceled' || status === 'autocanceled';

export const isReservationCurrent = (status: ReservationStatus) =>
  status === 'waiting' ||
  status === 'called' ||
  status === 'registered' ||
  status === 'entered';
