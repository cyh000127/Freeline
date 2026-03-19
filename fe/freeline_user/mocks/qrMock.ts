export type VerificationState = 'off' | 'on' | 'done';

export type MockWaitingItem = {
  waitingId: string;
  boothName: string;
  myRank: number;
  verificationState: VerificationState;
};

export const initialMockWaitings: MockWaitingItem[] = [
  {
    waitingId: 'waiting-1',
    boothName: 'SSAFY 부스',
    myRank: 5,
    verificationState: 'on', // show button
  },
  {
    waitingId: 'waiting-2',
    boothName: 'POSCO DX',
    myRank: 8,
    verificationState: 'off', // no button
  },
  {
    waitingId: 'waiting-3',
    boothName: 'LG CNS',
    myRank: 2,
    verificationState: 'done', // already verified
  },
];

// TODO(api): replace this mock with backend-driven queue/verification response
