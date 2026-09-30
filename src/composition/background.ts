import { createTimerService } from '../core/application/timer-service';
import {
  isExtensionMessage,
  MESSAGE_TYPES,
  type ExtensionMessage,
  type ExtensionResponse,
} from '../core/ports/message-port';
import { TIMER_ALARM_NAME } from '../core/ports/timer-runtime-port';
import { formatBadge, getRemainingMilliseconds, TIMER_STATES } from '../core/timer/timer-model';
import browser from '../adapters/browser/webextension-api';
import { createWebExtensionAlarm } from '../adapters/alarm/webextension-alarm';
import { createWebExtensionCompletionAlert } from '../adapters/alert/webextension-completion-alert';
import { createWebExtensionBadge } from '../adapters/badge/webextension-badge';
import { systemClock } from '../adapters/clock/system-clock';
import { createWebExtensionLifecycle } from '../adapters/lifecycle/webextension-lifecycle';
import { createWebExtensionMessaging } from '../adapters/messaging/webextension-messaging';
import { createChromeOffscreen } from '../adapters/offscreen/chrome-offscreen';
import { createWebExtensionStorage } from '../adapters/storage/webextension-storage';

const storage = createWebExtensionStorage(browser);
const timerService = createTimerService({ storage, clock: systemClock });
const alarm = createWebExtensionAlarm(browser);
const badge = createWebExtensionBadge(browser);
const completionAlert = createWebExtensionCompletionAlert(browser);
const offscreen = createChromeOffscreen(browser);
const lifecycle = createWebExtensionLifecycle(browser);
const messaging = createWebExtensionMessaging(browser);

async function synchronize(
  snapshot: Awaited<ReturnType<typeof timerService.getSnapshot>>,
): Promise<void> {
  if (snapshot.state === TIMER_STATES.running && snapshot.endAtMs !== null) {
    await alarm.schedule(TIMER_ALARM_NAME, snapshot.endAtMs);
    await offscreen.start(snapshot.endAtMs);
    await badge.setText(formatBadge(getRemainingMilliseconds(snapshot, systemClock.now())));
    return;
  }

  await alarm.clear(TIMER_ALARM_NAME);
  await offscreen.stop();
  await badge.setText('');
}

async function reconcileAndSynchronize(openAlert: boolean): Promise<void> {
  const snapshot = await timerService.reconcile();
  await synchronize(snapshot);

  if (openAlert && snapshot.state === TIMER_STATES.completed) {
    await completionAlert.open();
  }
}

async function handleMessage(message: unknown): Promise<ExtensionResponse | undefined> {
  if (!isExtensionMessage(message)) {
    return { ok: false, message: 'Invalid timer message.' };
  }

  if (
    message.type === MESSAGE_TYPES.startBadgeUpdates ||
    message.type === MESSAGE_TYPES.stopBadgeUpdates
  ) {
    return undefined;
  }

  if (message.type === MESSAGE_TYPES.updateBadge) {
    await handleBadgeUpdate(message.remainingMs);
    return undefined;
  }

  try {
    const snapshot = await dispatchMessage(message);
    await synchronize(snapshot);

    if (message.type !== MESSAGE_TYPES.getSnapshot && snapshot.state === TIMER_STATES.completed) {
      await completionAlert.open();
    }

    return { ok: true, snapshot };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'The timer action failed.',
    };
  }
}

async function handleBadgeUpdate(remainingMs: number): Promise<void> {
  const snapshot = await timerService.reconcile();

  if (remainingMs <= 0 || snapshot.state !== TIMER_STATES.running) {
    await synchronize(snapshot);
    return;
  }

  await badge.setText(formatBadge(getRemainingMilliseconds(snapshot, systemClock.now())));
}

async function dispatchMessage(message: ExtensionMessage) {
  if (message.type === MESSAGE_TYPES.getSnapshot) {
    return timerService.reconcile();
  }

  if (message.type === MESSAGE_TYPES.start) {
    return timerService.start();
  }

  if (message.type === MESSAGE_TYPES.pause) {
    return timerService.pause();
  }

  if (message.type === MESSAGE_TYPES.refresh) {
    return timerService.refresh();
  }

  if (message.type === MESSAGE_TYPES.selectDuration) {
    return timerService.selectDuration(message.durationMinutes);
  }

  if (message.type === MESSAGE_TYPES.selectAndStart) {
    return timerService.selectAndStart(message.durationMinutes);
  }

  if (message.type === MESSAGE_TYPES.cancelCompletion) {
    return timerService.cancelCompletion();
  }

  if (message.type === MESSAGE_TYPES.restart) {
    return timerService.restart(message.durationMinutes);
  }

  if (
    message.type === MESSAGE_TYPES.startBadgeUpdates ||
    message.type === MESSAGE_TYPES.stopBadgeUpdates ||
    message.type === MESSAGE_TYPES.updateBadge
  ) {
    return timerService.getSnapshot();
  }

  const exhaustiveMessage: never = message;
  return exhaustiveMessage;
}

async function initialize(): Promise<void> {
  await timerService.initialize();
  await reconcileAndSynchronize(true);
}

// Register listeners synchronously so Chrome can restore them after suspension.
messaging.onMessage((message) => handleMessage(message));
alarm.onAlarm(async (name) => {
  if (name !== TIMER_ALARM_NAME) {
    return;
  }

  await reconcileAndSynchronize(true);
});
lifecycle.onInstalled(() => initialize());
lifecycle.onStartup(() => initialize());
void initialize();
