export type JwtPayload = {
  sub?: string;
  role?: string;
  exp?: number;
  iat?: number;
};

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function normalizeBase64(value: string) {
  return value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
}

function decodeBase64(value: string) {
  const normalized = normalizeBase64(value);
  let output = '';
  let index = 0;

  while (index < normalized.length) {
    const enc1 = BASE64_CHARS.indexOf(normalized[index] ?? 'A');
    const enc2 = BASE64_CHARS.indexOf(normalized[index + 1] ?? 'A');
    const enc3 =
      normalized[index + 2] === '='
        ? 64
        : BASE64_CHARS.indexOf(normalized[index + 2] ?? 'A');
    const enc4 =
      normalized[index + 3] === '='
        ? 64
        : BASE64_CHARS.indexOf(normalized[index + 3] ?? 'A');

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }

    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }

    index += 4;
  }

  try {
    return decodeURIComponent(
      output
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  } catch {
    return output;
  }
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split('.');

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserIdFromAccessToken(token: string | null): number | null {
  if (!token) {
    return null;
  }

  const parsed = Number(decodeJwtPayload(token)?.sub);

  return Number.isFinite(parsed) ? parsed : null;
}
