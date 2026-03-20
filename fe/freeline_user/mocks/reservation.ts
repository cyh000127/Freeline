import { ReservationItem } from '@/types/reservation';

export const mockReservations: ReservationItem[] = [
  {
    id: '1',
    boothName: '현대 글로비스',
    status: 'called',
    waitingOrder: 13,
    estimatedWaitMinutes: 25,
    boothLocation: 'A홀 2구역',
    reservedAt: '2026.03.06 15:40',
    notice: '호출 후 5분 내 QR 인증을 진행해주세요.',
  },
  {
    id: '2',
    boothName: '두산',
    status: 'waiting',
    waitingOrder: 25,
    estimatedWaitMinutes: 67,
    boothLocation: 'B홀 1구역',
    reservedAt: '2026.03.06 14:55',
  },
  {
    id: '3',
    boothName: 'LS일렉트릭',
    status: 'registered',
    waitingOrder: 41,
    estimatedWaitMinutes: 114,
    boothLocation: 'C홀 4구역',
    reservedAt: '2026.03.06 14:10',
  },
  {
    id: '4',
    boothName: '포스코 DX',
    status: 'completed',
    boothLocation: 'A홀 3구역',
    reservedAt: '2026.03.05 13:20',
  },
  {
    id: '5',
    boothName: '한화',
    status: 'autocanceled',
    boothLocation: 'D홀 2구역',
    reservedAt: '2026.03.05 16:00',
  },
];
