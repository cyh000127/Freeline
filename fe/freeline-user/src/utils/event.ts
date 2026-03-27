import type { VisitorEventDetail } from '@/features/api/event';

export type EventProfile = {
  eventId: number;
  name: string;
  dateLabel: string;
  dayLabel: string;
  venueLabel: string;
  bannerImage: string | number | null;
  mapImageUrl: string | null;
};

const defaultEvent = {
  name: 'AW 2026 스마트 제조혁신 산업전',
  dateLabel: '2026.03.06 ~ 2026.03.08',
  dayLabel: '2일차',
  venueLabel: '서울 코엑스',
  bannerImage: require('../../assets/events/event_banner.png'),
  mapImageUrl: null,
};

export function parseEventIdFromEntryCode(entryCode: string) {
  const match = entryCode.trim().match(/^E(\d+)-/i);

  if (!match) {
    return 1;
  }

  return Number(match[1]);
}

function formatDateLabel(startDate: string, endDate: string) {
  return `${startDate.replaceAll('-', '.')} ~ ${endDate.replaceAll('-', '.')}`;
}

function formatDayLabel(startDate: string, endDate: string) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return defaultEvent.dayLabel;
  }

  const diffTime = today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const totalDays =
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (dayIndex >= 1 && dayIndex <= totalDays) {
    return `${dayIndex}일차`;
  }

  return `${totalDays}일 행사`;
}

export function toEventProfile(event: VisitorEventDetail): EventProfile {
  return {
    eventId: event.eventId,
    name: event.name || defaultEvent.name,
    dateLabel: formatDateLabel(event.startDate, event.endDate),
    dayLabel: formatDayLabel(event.startDate, event.endDate),
    venueLabel: event.locationAddress || defaultEvent.venueLabel,
    bannerImage: event.thumbnailImageUrl || defaultEvent.bannerImage,
    mapImageUrl: event.mapImageUrl,
  };
}

export function getEventProfile(eventId: number): EventProfile {
  return {
    eventId,
    ...defaultEvent,
  };
}
