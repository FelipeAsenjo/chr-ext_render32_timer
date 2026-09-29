import { describe, expect, it } from 'vitest';
import { createTimerService } from '../src/core/application/timer-service';
import { createMemoryStorage } from '../src/adapters/storage/memory-storage';
import {
  DEFAULT_DURATION_MINUTES,
  TIMER_STATES,
  durationMinutesToMilliseconds,
} from '../src/core/timer/timer-model';

function createClock(initialTime = 1_000_000): {
  now: () => number;
  advance: (milliseconds: number) => void;
} {
  let currentTime = initialTime;

  return {
    now: () => currentTime,
    advance: (milliseconds) => {
      currentTime += milliseconds;
    },
  };
}

function createService(initialTime?: number): {
  service: ReturnType<typeof createTimerService>;
  clock: ReturnType<typeof createClock>;
} {
  const clock = createClock(initialTime);
  const service = createTimerService({
    storage: createMemoryStorage(),
    clock,
  });

  return { service, clock };
}

describe('timer service', () => {
  it('initializes the default duration in idle state', async () => {
    const { service } = createService();

    await expect(service.initialize()).resolves.toEqual({
      state: TIMER_STATES.idle,
      selectedDurationMs: durationMinutesToMilliseconds(DEFAULT_DURATION_MINUTES),
      endAtMs: null,
      remainingMs: null,
    });
  });

  it('starts a selected duration immediately', async () => {
    const { service, clock } = createService();

    const snapshot = await service.selectAndStart(5);

    expect(snapshot.state).toBe(TIMER_STATES.running);
    expect(snapshot.endAtMs).toBe(clock.now() + durationMinutesToMilliseconds(5));
  });

  it('pauses and resumes with the exact remaining duration', async () => {
    const { service, clock } = createService();

    await service.selectAndStart(5);
    clock.advance(12_345);
    const paused = await service.pause();

    expect(paused.state).toBe(TIMER_STATES.paused);
    expect(paused.remainingMs).toBe(durationMinutesToMilliseconds(5) - 12_345);

    if (paused.remainingMs === null) {
      throw new Error('Expected the paused timer to preserve remaining time.');
    }

    const resumed = await service.start();
    expect(resumed.state).toBe(TIMER_STATES.running);
    expect(resumed.endAtMs).toBe(clock.now() + paused.remainingMs);
  });

  it('refreshes using the last selected duration', async () => {
    const { service, clock } = createService();

    await service.selectAndStart(10);
    clock.advance(30_000);
    const refreshed = await service.refresh();

    expect(refreshed.selectedDurationMs).toBe(durationMinutesToMilliseconds(10));
    expect(refreshed.endAtMs).toBe(clock.now() + durationMinutesToMilliseconds(10));
  });

  it('reconciles an elapsed running timer as completed', async () => {
    const { service, clock } = createService();

    await service.selectAndStart(1);
    clock.advance(durationMinutesToMilliseconds(1));

    await expect(service.reconcile()).resolves.toMatchObject({
      state: TIMER_STATES.completed,
      endAtMs: null,
      remainingMs: 0,
    });
  });

  it('cancels completion to the default selection', async () => {
    const { service, clock } = createService();

    await service.selectAndStart(1);
    clock.advance(durationMinutesToMilliseconds(1));
    await service.reconcile();

    const cancelled = await service.cancelCompletion();
    expect(cancelled).toEqual({
      state: TIMER_STATES.idle,
      selectedDurationMs: durationMinutesToMilliseconds(DEFAULT_DURATION_MINUTES),
      endAtMs: null,
      remainingMs: null,
    });
  });

  it('rejects invalid custom durations', async () => {
    const { service } = createService();

    await expect(service.selectAndStart(0)).rejects.toThrow(RangeError);
    await expect(service.selectAndStart(1441)).rejects.toThrow(RangeError);
    await expect(service.selectAndStart(2.5)).rejects.toThrow(RangeError);
  });

  it('ignores malformed persisted state', async () => {
    const storage = createMemoryStorage({
      timerState: { state: 'running', selectedDurationMs: 'bad' },
    });
    const clock = createClock();
    const service = createTimerService({ storage, clock });

    await expect(service.initialize()).resolves.toMatchObject({ state: TIMER_STATES.idle });
  });
});
