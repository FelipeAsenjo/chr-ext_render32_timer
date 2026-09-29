export const DEFAULT_DURATION_MINUTES = 45;
export const MIN_DURATION_MINUTES = 1;
export const MAX_DURATION_MINUTES = 1440;
export const QUICK_ACCESS_MINUTES = [5, 10, 15, 30, 45, 60, 90] as const;
export const MILLISECONDS_PER_MINUTE = 60_000;

export const TIMER_STATES = {
  idle: 'idle',
  running: 'running',
  paused: 'paused',
  completed: 'completed',
} as const;

export type TimerState = (typeof TIMER_STATES)[keyof typeof TIMER_STATES];

export interface TimerSnapshot {
  readonly state: TimerState;
  readonly selectedDurationMs: number;
  readonly endAtMs: number | null;
  readonly remainingMs: number | null;
}

export function durationMinutesToMilliseconds(minutes: number): number {
  if (
    !Number.isInteger(minutes) ||
    minutes < MIN_DURATION_MINUTES ||
    minutes > MAX_DURATION_MINUTES
  ) {
    throw new RangeError(
      `Duration must be an integer between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`,
    );
  }

  return minutes * MILLISECONDS_PER_MINUTE;
}

export function millisecondsToMinutes(milliseconds: number): number {
  return milliseconds / MILLISECONDS_PER_MINUTE;
}

export function createInitialTimerSnapshot(): TimerSnapshot {
  return {
    state: TIMER_STATES.idle,
    selectedDurationMs: durationMinutesToMilliseconds(DEFAULT_DURATION_MINUTES),
    endAtMs: null,
    remainingMs: null,
  };
}

export function isTimerState(value: unknown): value is TimerState {
  return (
    value === TIMER_STATES.idle ||
    value === TIMER_STATES.running ||
    value === TIMER_STATES.paused ||
    value === TIMER_STATES.completed
  );
}

export function isTimerSnapshot(value: unknown): value is TimerSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  const record = value;

  return (
    isTimerState(record.state) &&
    typeof record.selectedDurationMs === 'number' &&
    Number.isInteger(record.selectedDurationMs) &&
    record.selectedDurationMs >= durationMinutesToMilliseconds(MIN_DURATION_MINUTES) &&
    record.selectedDurationMs <= durationMinutesToMilliseconds(MAX_DURATION_MINUTES) &&
    (record.endAtMs === null ||
      (typeof record.endAtMs === 'number' && Number.isFinite(record.endAtMs))) &&
    (record.remainingMs === null ||
      (typeof record.remainingMs === 'number' &&
        Number.isFinite(record.remainingMs) &&
        record.remainingMs >= 0))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getRemainingMilliseconds(snapshot: TimerSnapshot, nowMs: number): number {
  if (snapshot.state === TIMER_STATES.running && snapshot.endAtMs !== null) {
    return Math.max(0, snapshot.endAtMs - nowMs);
  }

  if (snapshot.state === TIMER_STATES.paused && snapshot.remainingMs !== null) {
    return snapshot.remainingMs;
  }

  return 0;
}
