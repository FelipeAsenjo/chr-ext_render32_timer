import { extensionClient } from '../composition/extension-client';
import {
  isExtensionResponse,
  MESSAGE_TYPES,
  type ExtensionMessage,
  type ExtensionResponse,
} from '../core/ports/message-port';
import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  QUICK_ACCESS_MINUTES,
  formatCountdown,
  getRemainingMilliseconds,
  TIMER_STATES,
  type TimerSnapshot,
} from '../core/timer/timer-model';

const countdown = document.querySelector<HTMLParagraphElement>('#countdown');
const selectedDuration = document.querySelector<HTMLParagraphElement>('#selected-duration');
const state = document.querySelector<HTMLParagraphElement>('#state');
const startPauseButton = document.querySelector<HTMLButtonElement>('#start-pause');
const refreshButton = document.querySelector<HTMLButtonElement>('#refresh');
const quickAccess = document.querySelector<HTMLDivElement>('#quick-access');
const customDuration = document.querySelector<HTMLSelectElement>('#custom-duration');
const status = document.querySelector<HTMLParagraphElement>('#status');

if (
  !countdown ||
  !selectedDuration ||
  !state ||
  !startPauseButton ||
  !refreshButton ||
  !quickAccess ||
  !customDuration ||
  !status
) {
  throw new Error('Popup markup is missing the required timer controls.');
}

const countdownElement = countdown;
const selectedDurationElement = selectedDuration;
const stateElement = state;
const startPauseButtonElement = startPauseButton;
const refreshButtonElement = refreshButton;
const quickAccessElement = quickAccess;
const customDurationElement = customDuration;
const statusElement = status;

let snapshot: TimerSnapshot | undefined;
let snapshotRequestInFlight = false;

function createDurationOptions(): void {
  for (let minutes = MIN_DURATION_MINUTES; minutes <= MAX_DURATION_MINUTES; minutes += 1) {
    const option = document.createElement('option');
    option.value = String(minutes);
    option.textContent = `${minutes} min`;
    customDurationElement.append(option);
  }
}

function createQuickAccessButtons(): void {
  for (const minutes of QUICK_ACCESS_MINUTES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quick-button';
    button.dataset.minutes = String(minutes);
    button.textContent = String(minutes);
    quickAccessElement.append(button);
  }
}

function showStatus(message: string, isError = false): void {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
}

function clearStatus(): void {
  showStatus('');
}

function getDisplayRemainingMilliseconds(currentSnapshot: TimerSnapshot): number {
  return getRemainingMilliseconds(currentSnapshot, Date.now());
}

function render(): void {
  if (!snapshot) {
    return;
  }

  const remainingMilliseconds = getDisplayRemainingMilliseconds(snapshot);
  countdownElement.textContent = formatCountdown(remainingMilliseconds);
  selectedDurationElement.textContent = `${Math.round(snapshot.selectedDurationMs / 60_000)} minutes selected`;
  stateElement.textContent = getStateLabel(snapshot.state);
  startPauseButtonElement.textContent = getStartPauseLabel(snapshot.state);
  startPauseButtonElement.disabled = snapshot.state === TIMER_STATES.completed;
  refreshButtonElement.disabled = snapshot.state === TIMER_STATES.completed;
  customDurationElement.value = String(Math.round(snapshot.selectedDurationMs / 60_000));

  const choicesDisabled =
    snapshot.state === TIMER_STATES.running || snapshot.state === TIMER_STATES.completed;
  customDurationElement.disabled = choicesDisabled;
  quickAccessElement.querySelectorAll('button').forEach((button) => {
    button.disabled = choicesDisabled;
  });
}

function getStateLabel(timerState: TimerSnapshot['state']): string {
  if (timerState === TIMER_STATES.running) {
    return 'Running';
  }

  if (timerState === TIMER_STATES.paused) {
    return 'Paused';
  }

  if (timerState === TIMER_STATES.completed) {
    return 'Complete';
  }

  return 'Ready';
}

function getStartPauseLabel(timerState: TimerSnapshot['state']): string {
  if (timerState === TIMER_STATES.running) {
    return 'Pause';
  }

  if (timerState === TIMER_STATES.paused) {
    return 'Resume';
  }

  return 'Start';
}

async function send(message: ExtensionMessage): Promise<TimerSnapshot> {
  const response = await extensionClient.send<ExtensionResponse>(message);

  if (!isExtensionResponse(response)) {
    throw new Error('Received an invalid response from the background context.');
  }

  if (!response.ok) {
    throw new Error(response.message);
  }

  return response.snapshot;
}

async function updateSnapshot(message: ExtensionMessage): Promise<void> {
  try {
    snapshot = await send(message);
    clearStatus();
    render();
  } catch (error: unknown) {
    showStatus(error instanceof Error ? error.message : 'Could not update the timer.', true);
  }
}

async function loadSnapshot(): Promise<void> {
  if (snapshotRequestInFlight) {
    return;
  }

  snapshotRequestInFlight = true;

  try {
    snapshot = await send({ type: MESSAGE_TYPES.getSnapshot });
    render();
  } catch (error: unknown) {
    showStatus(error instanceof Error ? error.message : 'Could not load the timer.', true);
  } finally {
    snapshotRequestInFlight = false;
  }
}

startPauseButtonElement.addEventListener('click', () => {
  if (!snapshot) {
    return;
  }

  const message: ExtensionMessage =
    snapshot.state === TIMER_STATES.running
      ? { type: MESSAGE_TYPES.pause }
      : { type: MESSAGE_TYPES.start };
  void updateSnapshot(message);
});

refreshButtonElement.addEventListener('click', () => {
  void updateSnapshot({ type: MESSAGE_TYPES.refresh });
});

quickAccessElement.addEventListener('click', (event) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement) || target.dataset.minutes === undefined) {
    return;
  }

  void updateSnapshot({
    type: MESSAGE_TYPES.selectAndStart,
    durationMinutes: Number(target.dataset.minutes),
  });
});

customDurationElement.addEventListener('change', () => {
  void updateSnapshot({
    type: MESSAGE_TYPES.selectAndStart,
    durationMinutes: Number(customDurationElement.value),
  });
});

createDurationOptions();
createQuickAccessButtons();
void loadSnapshot();

window.setInterval(() => {
  if (!snapshot || snapshot.state !== TIMER_STATES.running) {
    return;
  }

  render();

  if (getDisplayRemainingMilliseconds(snapshot) === 0) {
    void loadSnapshot();
  }
}, 250);
