import { postData, withAccessToken } from '@/lib/request';

export type QrScanResponse = {
  qrId: number;
  boothId: number;
  waitingId: number;
  visitorId: number;
  previousStatus: string;
  currentStatus: string;
  registeredAt: string;
};

export async function scanQr(accessToken: string, qrCode: string) {
  return postData<QrScanResponse>(
    '/qr/scan',
    { qrCode },
    withAccessToken(accessToken),
  );
}
