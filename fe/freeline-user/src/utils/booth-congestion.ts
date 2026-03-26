import { palette } from '@/theme/colors';

export type BoothCongestion = {
  tone: 'smooth' | 'normal' | 'busy' | 'closed' | 'unknown';
  label: string;
  backgroundColor: string;
  textColor: string;
  outlineColor: string;
};

export function getBoothCongestion(
  waitingCount: number | null | undefined,
  isEmergencyClosed: boolean,
): BoothCongestion {
  if (isEmergencyClosed) {
    return {
      tone: 'closed',
      label: '긴급 마감',
      backgroundColor: '#FFF0F0',
      textColor: palette.danger,
      outlineColor: '#FFD8D8',
    };
  }

  if (waitingCount == null) {
    return {
      tone: 'unknown',
      label: '정보 없음',
      backgroundColor: palette.surfaceAlt,
      textColor: palette.textMuted,
      outlineColor: palette.borderStrong,
    };
  }

  if (waitingCount <= 4) {
    return {
      tone: 'smooth',
      label: '원활',
      backgroundColor: '#EAFBF1',
      textColor: palette.success,
      outlineColor: '#CBEEDB',
    };
  }

  if (waitingCount <= 10) {
    return {
      tone: 'normal',
      label: '보통',
      backgroundColor: '#FFF7E3',
      textColor: palette.warning,
      outlineColor: '#F8E0A3',
    };
  }

  return {
    tone: 'busy',
    label: '혼잡',
    backgroundColor: '#FFF0F0',
    textColor: palette.danger,
    outlineColor: '#FFD8D8',
  };
}
