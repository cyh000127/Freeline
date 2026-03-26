import { API_BASE_URL } from '@/constants/env';

function getApiOrigin() {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return API_BASE_URL;
  }
}

export function normalizeImageUrl(imageUrl?: string | null) {
  if (typeof imageUrl !== 'string') {
    return null;
  }

  const trimmed = imageUrl.trim();

  if (!trimmed) {
    return null;
  }

  if (/^(https?:|data:|file:|content:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  try {
    return new URL(trimmed, getApiOrigin()).toString();
  } catch {
    return null;
  }
}
