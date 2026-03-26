import { http } from '@/lib/http';
import { unwrap } from '@/lib/api';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: string;
  boothId: number | null;
  isPasswordChangeRequired: boolean;
  company: string | null;
  boothName: string | null;
};

export async function authenticateEntryCode(entryCode: string) {
  const response = await http.post('/auth/visitors/entry-code/authenticate', {
    entryCode,
  });

  return unwrap<LoginResponse>(response);
}

export async function logout(accessToken: string) {
  await http.post(
    '/auth/logout',
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}
