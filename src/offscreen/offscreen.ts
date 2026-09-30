import browser from '../adapters/browser/webextension-api';
import { isExtensionMessage, MESSAGE_TYPES } from '../core/ports/message-port';

interface TickMessage {
  readonly type: 'tick';
  readonly remainingMs: number;
}

interface TimerWorker {
  postMessage(
    message: { readonly type: 'start'; readonly endAtMs: number } | { readonly type: 'stop' },
  ): void;
  terminate(): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<TickMessage>) => void): void;
}

let worker: TimerWorker | undefined;

function stopWorker(): void {
  worker?.postMessage({ type: 'stop' });
  worker?.terminate();
  worker = undefined;
}

function startWorker(endAtMs: number): void {
  stopWorker();
  worker = new Worker(new URL('./badge-worker.ts', import.meta.url), { type: 'module' });
  worker.addEventListener('message', (event) => {
    if (event.data.type !== 'tick') {
      return;
    }

    void browser.runtime.sendMessage({
      type: MESSAGE_TYPES.updateBadge,
      remainingMs: event.data.remainingMs,
    });
  });
  worker.postMessage({ type: 'start', endAtMs });
}

browser.runtime.onMessage.addListener((message: unknown) => {
  if (!isExtensionMessage(message)) {
    return;
  }

  if (message.type === MESSAGE_TYPES.startBadgeUpdates) {
    startWorker(message.endAtMs);
  }

  if (message.type === MESSAGE_TYPES.stopBadgeUpdates) {
    stopWorker();
  }
});
