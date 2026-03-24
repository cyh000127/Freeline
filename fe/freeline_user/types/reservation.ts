export type ReservationStatus =
  | 'waiting'
  | 'called'
  | 'registered'
  | 'entered'
  | 'completed'
  | 'canceled'
  | 'autocanceled';

export interface ReservationItem {
  id: string;
  boothName: string;
  boothLocation?: string;
  status: ReservationStatus;
  waitingOrder?: number;
  estimatedWaitText?: number;
  reservedAt?: string;
  notice?: string;
}
