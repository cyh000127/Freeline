export type ExperienceStatus =
  | 'idle' // default
  | 'called' // QR required
  | 'active' // in progress
  | 'warning' // almost done (yellow)
  | 'overdue'; // exceeded (red)

export interface ExperienceState {
  boothName?: string;
  status: ExperienceStatus;
  elapsedTime?: string;
  remainingTime?: string;
}
