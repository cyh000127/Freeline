import { postData, postOk, withAccessToken } from '@/lib/request';

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
  return postData<LoginResponse>('/auth/visitors/entry-code/authenticate', {
    entryCode,
  });
}

export async function logout(accessToken: string) {
  await postOk(
    '/auth/logout',
    {},
    withAccessToken(accessToken),
  );
}
