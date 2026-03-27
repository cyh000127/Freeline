import { jwtDecode } from 'jwt-decode';

type TokenPayload = {
  sub?: string;
  exp?: number;
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

export function getTokenExpirationTime(token: string) {
  const payload = jwtDecode<TokenPayload>(token);

  if (typeof payload.exp !== 'number') {
    return null;
  }

  return payload.exp * 1000;
}

export function isTokenExpired(token: string, now = Date.now()) {
  const expirationTime = getTokenExpirationTime(token);

  if (expirationTime == null) {
    return false;
  }

  return expirationTime <= now;
}
