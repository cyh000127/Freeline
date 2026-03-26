import { unwrap } from '@/lib/api';
import { http } from '@/lib/http';

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
  const response = await http.post(
    '/qr/scan',
    { qrCode },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return unwrap<QrScanResponse>(response);
}
