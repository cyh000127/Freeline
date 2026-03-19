export type MainStatus = 'safe' | 'warning' | 'danger';

export type StatusPalette = {
  bg: string;
  border: string;
  text: string;
  softText?: string;
  buttonBg: string;
  buttonText: string;
  badgeBg?: string;
  badgeText?: string;
};

export const STATUS_PALETTE: Record<MainStatus, StatusPalette> = {
  safe: {
    bg: '#EAF9ED',
    border: 'rgba(79, 184, 102, 0.2)',
    text: '#28A745',
    softText: '#28A745',
    buttonBg: 'rgba(40, 167, 69, 0.8)',
    buttonText: '#FFFFFF',
    badgeBg: 'rgba(40, 167, 69, 0.14)',
    badgeText: '#28A745',
  },
  warning: {
    bg: '#FFF6D6',
    border: 'rgba(194, 136, 0, 0.2)',
    text: '#C28800',
    softText: '#C28800',
    buttonBg: 'rgba(194, 136, 0, 0.8)',
    buttonText: '#FFFFFF',
    badgeBg: 'rgba(194, 136, 0, 0.14)',
    badgeText: '#C28800',
  },
  danger: {
    bg: '#FFE8E6',
    border: 'rgba(255, 77, 79, 0.2)',
    text: '#FF4D4F',
    softText: '#FF4D4F',
    buttonBg: 'rgba(255, 77, 79, 0.8)',
    buttonText: '#FFFFFF',
    badgeBg: 'rgba(255, 77, 79, 0.14)',
    badgeText: '#FF4D4F',
  },
};
