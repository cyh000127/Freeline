export const NICKNAME_PATTERN = /^[가-힣]{1,8}$/;

export function isValidNickname(value: string) {
  return NICKNAME_PATTERN.test(value.trim());
}

export const NICKNAME_GUIDE_TEXT = '완성된 한글 1~8자만 사용할 수 있어요.';
