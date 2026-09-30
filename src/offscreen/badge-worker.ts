interface WorkerCommand {
  readonly type: 'start' | 'stop';
  readonly endAtMs?: number;
}

interface WorkerTick {
  readonly type: 'tick';
  readonly remainingMs: number;
}

interface WorkerGlobal {
  onmessage: ((event: MessageEvent<WorkerCommand>) => void) | null;
  postMessage(message: WorkerTick): void;
}

const workerGlobal = globalThis as unknown as WorkerGlobal;
let interval: ReturnType<typeof setInterval> | undefined;

function stop(): void {
  if (interval !== undefined) {
    clearInterval(interval);
    interval = undefined;
  }
}

function start(endAtMs: number): void {
  stop();

  const tick = (): void => {
    workerGlobal.postMessage({
      type: 'tick',
      remainingMs: Math.max(0, endAtMs - Date.now()),
    });
  };

  tick();
  interval = setInterval(tick, 1_000);
}

workerGlobal.onmessage = (event) => {
  if (event.data.type === 'stop') {
    stop();
    return;
  }

  if (event.data.type === 'start' && event.data.endAtMs !== undefined) {
    start(event.data.endAtMs);
  }
};
