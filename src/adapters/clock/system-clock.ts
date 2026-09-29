import type { ClockPort } from '../../core/ports/clock-port';

export const systemClock: ClockPort = {
  now: () => Date.now(),
};
