export function formatMinutes(minutes: number | null | undefined) {
  if (minutes == null || minutes <= 0) {
    return '예상 대기시간 정보 없음';
  }

  return `예상 대기시간: 약 ${minutes}분`;
}

export function formatWaitingStatus(status: string) {
  switch (status) {
    case 'WAITING':
      return '정상 대기 중';
    case 'CALLED':
      return '도착 인증 필요';
    case 'REGISTERED':
      return '대기 인증 완료';
    case 'ENTERED':
      return '체험 진행 중';
    case 'EXITED':
      return '이용 종료';
    case 'CANCELED':
      return '예약 취소';
    case 'EXPIRED':
      return '호출 만료';
    default:
      return status;
  }
}

export function formatQueueStatus(status: string) {
  switch (status) {
    case 'FREE':
      return '현재 추가 이동 가능';
    case 'FRONT_QUEUE_OCCUPIED':
      return '도착 인증 대기 중';
    case 'IN_BOOTH':
      return '현재 체험 중';
    default:
      return status;
  }
}

export function formatHistoryStatus(status: string) {
  switch (status) {
    case 'EXITED':
      return '체험 완료';
    case 'CANCELED':
      return '예약 취소';
    case 'EXPIRED':
      return '호출 만료';
    default:
      return formatWaitingStatus(status);
  }
}
