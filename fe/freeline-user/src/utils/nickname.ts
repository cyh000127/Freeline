const NICKNAME_PATTERN = /^[가-힣]{1,8}$/;

export function normalizeNickname(value: string) {
  return value.trim();
}

export function validateNickname(value: string) {
  const normalized = normalizeNickname(value);

  if (!NICKNAME_PATTERN.test(normalized)) {
    throw new Error('한글만 가능하며 최대 8자까지 입력할 수 있습니다.');
  }

  return normalized;
}
