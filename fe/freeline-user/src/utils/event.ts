export type EventProfile = {
  eventId: number;
  name: string;
  dateLabel: string;
  dayLabel: string;
  venueLabel: string;
  bannerImage: number;
};

const defaultEvent = {
  name: 'AW 2026 스마트 제조혁신 산업전',
  dateLabel: '2026.03.06 ~ 2026.03.08',
  dayLabel: '2일차',
  venueLabel: '서울 코엑스',
  bannerImage: require('../../assets/events/event_banner.png'),
};

export function parseEventIdFromEntryCode(entryCode: string) {
  const match = entryCode.trim().match(/^E(\d+)-/i);

  if (!match) {
    return 1;
  }

  return Number(match[1]);
}

export function getEventProfile(eventId: number): EventProfile {
  return {
    eventId,
    ...defaultEvent,
  };
}
