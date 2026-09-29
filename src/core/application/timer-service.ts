import type { ClockPort } from '../ports/clock-port';
import type { StoragePort } from '../ports/storage-port';
import {
  createInitialTimerSnapshot,
  durationMinutesToMilliseconds,
  isTimerSnapshot,
  TIMER_STATES,
  type TimerSnapshot,
} from '../timer/timer-model';

export const TIMER_STORAGE_KEY = 'timerState';

export interface TimerService {
  initialize(): Promise<TimerSnapshot>;
  getSnapshot(): Promise<TimerSnapshot>;
  reconcile(): Promise<TimerSnapshot>;
  start(): Promise<TimerSnapshot>;
  pause(): Promise<TimerSnapshot>;
  refresh(): Promise<TimerSnapshot>;
  selectDuration(durationMinutes: number): Promise<TimerSnapshot>;
  selectAndStart(durationMinutes: number): Promise<TimerSnapshot>;
  cancelCompletion(): Promise<TimerSnapshot>;
  restart(durationMinutes: number): Promise<TimerSnapshot>;
}

export function createTimerService({
  storage,
  clock,
}: {
  storage: StoragePort;
  clock: ClockPort;
}): TimerService {
  let snapshot: TimerSnapshot | undefined;

  async function persist(nextSnapshot: TimerSnapshot): Promise<TimerSnapshot> {
    snapshot = nextSnapshot;
    await storage.set(TIMER_STORAGE_KEY, nextSnapshot);
    return nextSnapshot;
  }

  async function load(): Promise<TimerSnapshot> {
    const stored = await storage.get<unknown>(TIMER_STORAGE_KEY);
    snapshot = isTimerSnapshot(stored) ? stored : createInitialTimerSnapshot();

    if (stored === undefined || !isTimerSnapshot(stored)) {
      await storage.set(TIMER_STORAGE_KEY, snapshot);
    }

    return snapshot;
  }

  async function ensureLoaded(): Promise<TimerSnapshot> {
    return snapshot ?? load();
  }

  async function reconcileSnapshot(current: TimerSnapshot): Promise<TimerSnapshot> {
    if (
      current.state !== TIMER_STATES.running ||
      current.endAtMs === null ||
      current.endAtMs > clock.now()
    ) {
      return current;
    }

    return persist({
      ...current,
      state: TIMER_STATES.completed,
      endAtMs: null,
      remainingMs: 0,
    });
  }

  return {
    initialize: load,

    async getSnapshot(): Promise<TimerSnapshot> {
      return ensureLoaded();
    },

    async reconcile(): Promise<TimerSnapshot> {
      return reconcileSnapshot(await ensureLoaded());
    },

    async start(): Promise<TimerSnapshot> {
      const current = await reconcileSnapshot(await ensureLoaded());

      if (current.state === TIMER_STATES.running || current.state === TIMER_STATES.completed) {
        return current;
      }

      const durationMs =
        current.state === TIMER_STATES.paused ? current.remainingMs : current.selectedDurationMs;

      if (durationMs === null || durationMs <= 0) {
        return persist({
          ...current,
          state: TIMER_STATES.completed,
          endAtMs: null,
          remainingMs: 0,
        });
      }

      return persist({
        ...current,
        state: TIMER_STATES.running,
        endAtMs: clock.now() + durationMs,
        remainingMs: null,
      });
    },

    async pause(): Promise<TimerSnapshot> {
      const current = await reconcileSnapshot(await ensureLoaded());

      if (current.state !== TIMER_STATES.running || current.endAtMs === null) {
        return current;
      }

      const remainingMs = Math.max(0, current.endAtMs - clock.now());

      if (remainingMs === 0) {
        return persist({
          ...current,
          state: TIMER_STATES.completed,
          endAtMs: null,
          remainingMs: 0,
        });
      }

      return persist({
        ...current,
        state: TIMER_STATES.paused,
        endAtMs: null,
        remainingMs,
      });
    },

    async refresh(): Promise<TimerSnapshot> {
      const current = await ensureLoaded();

      return persist({
        ...current,
        state: TIMER_STATES.running,
        endAtMs: clock.now() + current.selectedDurationMs,
        remainingMs: null,
      });
    },

    async selectDuration(durationMinutes: number): Promise<TimerSnapshot> {
      const current = await ensureLoaded();

      if (current.state === TIMER_STATES.running || current.state === TIMER_STATES.completed) {
        return current;
      }

      const selectedDurationMs = durationMinutesToMilliseconds(durationMinutes);

      return persist({
        ...current,
        selectedDurationMs,
        remainingMs: current.state === TIMER_STATES.paused ? selectedDurationMs : null,
      });
    },

    async selectAndStart(durationMinutes: number): Promise<TimerSnapshot> {
      const current = await ensureLoaded();
      const selectedDurationMs = durationMinutesToMilliseconds(durationMinutes);

      return persist({
        ...current,
        state: TIMER_STATES.running,
        selectedDurationMs,
        endAtMs: clock.now() + selectedDurationMs,
        remainingMs: null,
      });
    },

    async cancelCompletion(): Promise<TimerSnapshot> {
      const current = await ensureLoaded();

      if (current.state !== TIMER_STATES.completed) {
        return current;
      }

      return persist(createInitialTimerSnapshot());
    },

    async restart(durationMinutes: number): Promise<TimerSnapshot> {
      const current = await ensureLoaded();
      const selectedDurationMs = durationMinutesToMilliseconds(durationMinutes);

      if (current.state !== TIMER_STATES.completed) {
        return current;
      }

      return persist({
        ...current,
        state: TIMER_STATES.running,
        selectedDurationMs,
        endAtMs: clock.now() + selectedDurationMs,
        remainingMs: null,
      });
    },
  };
}
