import { jwtDecode } from 'jwt-decode';

type TokenPayload = {
  sub?: string;
};

export function getUserIdFromToken(token: string) {
  const payload = jwtDecode<TokenPayload>(token);
  const raw = payload.sub ?? '';
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    throw new Error('토큰에서 사용자 정보를 읽을 수 없습니다.');
  }

  return parsed;
}
