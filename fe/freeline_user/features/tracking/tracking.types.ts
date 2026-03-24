export type ActionType =
  | 'PAGE_VIEW'
  | 'BOOTH_VIEW'
  | 'WAITING_REGISTER'
  | 'WAITING_CANCEL'
  | 'WAITING_COMPLETE'
  | 'GOODS_VIEW'
  | 'MAP_INTERACTION'
  | 'APP_OPEN'
  | 'PUSH_CLICK';

export type TargetType = 'BOOTH' | 'GOODS' | 'PAGE' | 'MAP' | 'NOTIFICATION';

export interface ActionLogEvent {
  eventId: number;
  action: ActionType;
  targetType?: TargetType;
  targetId?: string;
  metadata?: Record<string, unknown>;
  clientTimestamp: string;
  sessionId: string;
}

export interface ActionLogBulkRequest {
  logs: ActionLogEvent[];
}

export interface ActionLogBulkResponse {
  receivedCount: number;
  droppedCount: number;
}
