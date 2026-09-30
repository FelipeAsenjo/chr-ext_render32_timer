import { isTimerSnapshot, type TimerSnapshot } from '../timer/timer-model';

/** Messages accepted by the background application boundary. */
export const MESSAGE_TYPES = {
  getSnapshot: 'GET_TIMER_SNAPSHOT',
  start: 'START_TIMER',
  pause: 'PAUSE_TIMER',
  refresh: 'REFRESH_TIMER',
  selectDuration: 'SELECT_TIMER_DURATION',
  selectAndStart: 'SELECT_AND_START_TIMER',
  cancelCompletion: 'CANCEL_COMPLETION',
  restart: 'RESTART_TIMER',
  startBadgeUpdates: 'START_BADGE_UPDATES',
  stopBadgeUpdates: 'STOP_BADGE_UPDATES',
  updateBadge: 'UPDATE_BADGE',
} as const;

export type ExtensionMessage =
  | { readonly type: typeof MESSAGE_TYPES.getSnapshot }
  | { readonly type: typeof MESSAGE_TYPES.start }
  | { readonly type: typeof MESSAGE_TYPES.pause }
  | { readonly type: typeof MESSAGE_TYPES.refresh }
  | { readonly type: typeof MESSAGE_TYPES.selectDuration; readonly durationMinutes: number }
  | { readonly type: typeof MESSAGE_TYPES.selectAndStart; readonly durationMinutes: number }
  | { readonly type: typeof MESSAGE_TYPES.cancelCompletion }
  | { readonly type: typeof MESSAGE_TYPES.restart; readonly durationMinutes: number }
  | { readonly type: typeof MESSAGE_TYPES.startBadgeUpdates; readonly endAtMs: number }
  | { readonly type: typeof MESSAGE_TYPES.stopBadgeUpdates }
  | { readonly type: typeof MESSAGE_TYPES.updateBadge; readonly remainingMs: number };

export type ExtensionResponse =
  | { readonly ok: true; readonly snapshot: TimerSnapshot }
  | { readonly ok: false; readonly message: string };

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  if (
    value.type === MESSAGE_TYPES.getSnapshot ||
    value.type === MESSAGE_TYPES.start ||
    value.type === MESSAGE_TYPES.pause ||
    value.type === MESSAGE_TYPES.refresh ||
    value.type === MESSAGE_TYPES.cancelCompletion
  ) {
    return true;
  }

  if (
    (value.type === MESSAGE_TYPES.selectDuration ||
      value.type === MESSAGE_TYPES.selectAndStart ||
      value.type === MESSAGE_TYPES.restart) &&
    typeof value.durationMinutes === 'number'
  ) {
    return true;
  }

  if (value.type === MESSAGE_TYPES.startBadgeUpdates) {
    return typeof value.endAtMs === 'number' && Number.isFinite(value.endAtMs);
  }

  if (value.type === MESSAGE_TYPES.updateBadge) {
    return typeof value.remainingMs === 'number' && Number.isFinite(value.remainingMs);
  }

  return value.type === MESSAGE_TYPES.stopBadgeUpdates;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isExtensionResponse(value: unknown): value is ExtensionResponse {
  if (!isRecord(value) || typeof value.ok !== 'boolean') {
    return false;
  }

  if (value.ok) {
    return isTimerSnapshot(value.snapshot);
  }

  return typeof value.message === 'string';
}
