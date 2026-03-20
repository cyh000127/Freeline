import { useState } from 'react';
import { ExperienceState } from '@/types/experience';

export function useExperienceMock() {
  const [mode, setMode] = useState<ExperienceState['status']>('idle');

  const dataMap: Record<string, ExperienceState> = {
    idle: { status: 'idle' },

    called: {
      status: 'called',
      boothName: '포스코 DX',
    },

    active: {
      status: 'active',
      boothName: '포스코 DX',
      elapsedTime: '45분 30초',
      remainingTime: '체험 종료까지 10분 40초 남았습니다.',
    },

    warning: {
      status: 'warning',
      boothName: '포스코 DX',
      elapsedTime: '45분 30초',
      remainingTime: '체험 종료까지 1분 40초 남았습니다.',
    },

    overdue: {
      status: 'overdue',
      boothName: '포스코 DX',
      elapsedTime: '45분 30초',
      remainingTime: '체험 종료시간 10분 40초 넘었습니다.',
    },
  };

  return {
    data: dataMap[mode],
    setMode,
  };
}
