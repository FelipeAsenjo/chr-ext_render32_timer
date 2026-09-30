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
  type TimerSnapshot,
} from '../core/timer/timer-model';

const description = document.querySelector<HTMLParagraphElement>('#description');
const restartPanel = document.querySelector<HTMLElement>('#restart-panel');
const restartDurationDisplay = document.querySelector<HTMLButtonElement>(
  '#restart-duration-display',
);
const restartDurationEditor = document.querySelector<HTMLInputElement>('#restart-duration-editor');
const restartQuickAccess = document.querySelector<HTMLDivElement>('#restart-quick-access');
const cancelButton = document.querySelector<HTMLButtonElement>('#cancel');
const restartButton = document.querySelector<HTMLButtonElement>('#restart');
const confirmRestartButton = document.querySelector<HTMLButtonElement>('#confirm-restart');
const status = document.querySelector<HTMLParagraphElement>('#status');

if (
  !description ||
  !restartPanel ||
  !restartDurationDisplay ||
  !restartDurationEditor ||
  !restartQuickAccess ||
  !cancelButton ||
  !restartButton ||
  !confirmRestartButton ||
  !status
) {
  throw new Error('Alert markup is missing the required controls.');
}

const descriptionElement = description;
const restartPanelElement = restartPanel;
const restartDurationDisplayElement = restartDurationDisplay;
const restartDurationEditorElement = restartDurationEditor;
const restartQuickAccessElement = restartQuickAccess;
const cancelButtonElement = cancelButton;
const restartButtonElement = restartButton;
const confirmRestartButtonElement = confirmRestartButton;
const statusElement = status;

let selectedRestartMinutes = 45;
let editingRestartDuration = false;
let alarmContext: AudioContext | undefined;
let alarmInterval: number | undefined;
let alarmTimeout: number | undefined;

function centerAlertWindow(): void {
  const left = Math.max(0, (screen.availWidth - 420) / 2);
  const top = Math.max(0, (screen.availHeight - 480) / 2);

  window.moveTo(Math.round(left), Math.round(top));
  window.focus();
}

function showStatus(message: string, isError = false): void {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
}

function createQuickAccessButtons(): void {
  for (const minutes of QUICK_ACCESS_MINUTES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.minutes = String(minutes);
    button.textContent = String(minutes);
    restartQuickAccessElement.append(button);
  }
}

function setSelectedRestartMinutes(minutes: number): void {
  selectedRestartMinutes = minutes;
  restartDurationDisplayElement.textContent = `${minutes} minutes`;
  restartDurationEditorElement.value = String(minutes);
}

function enterRestartDurationEditing(): void {
  if (restartPanelElement.hidden === true) {
    return;
  }

  editingRestartDuration = true;
  restartDurationEditorElement.value = String(selectedRestartMinutes);
  restartDurationDisplayElement.hidden = true;
  restartDurationEditorElement.hidden = false;
  restartDurationEditorElement.focus();
  restartDurationEditorElement.select();
}

function cancelRestartDurationEditing(): void {
  if (!editingRestartDuration) {
    return;
  }

  editingRestartDuration = false;
  restartDurationEditorElement.hidden = true;
  restartDurationDisplayElement.hidden = false;
  setSelectedRestartMinutes(selectedRestartMinutes);
}

function confirmRestartDurationEditing(): void {
  if (!editingRestartDuration) {
    return;
  }

  const durationMinutes = Number(restartDurationEditorElement.value);

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < MIN_DURATION_MINUTES ||
    durationMinutes > MAX_DURATION_MINUTES
  ) {
    showStatus(
      `Enter a whole number from ${MIN_DURATION_MINUTES} to ${MAX_DURATION_MINUTES} minutes.`,
      true,
    );
    restartDurationEditorElement.focus();
    return;
  }

  editingRestartDuration = false;
  restartDurationEditorElement.hidden = true;
  restartDurationDisplayElement.hidden = false;
  setSelectedRestartMinutes(durationMinutes);
}

function startTone(): void {
  if (!alarmContext) {
    return;
  }

  const oscillator = alarmContext.createOscillator();
  const gain = alarmContext.createGain();
  oscillator.frequency.value = 880;
  oscillator.type = 'square';
  gain.gain.setValueAtTime(0.035, alarmContext.currentTime);
  oscillator.connect(gain);
  gain.connect(alarmContext.destination);
  oscillator.start();
  oscillator.stop(alarmContext.currentTime + 0.22);
}

function stopAlarm(): void {
  if (alarmInterval !== undefined) {
    window.clearInterval(alarmInterval);
    alarmInterval = undefined;
  }

  if (alarmTimeout !== undefined) {
    window.clearTimeout(alarmTimeout);
    alarmTimeout = undefined;
  }

  if (alarmContext) {
    void alarmContext.close();
    alarmContext = undefined;
  }
}

function startAlarm(): void {
  try {
    alarmContext = new AudioContext();
    void alarmContext.resume();
    startTone();
    alarmInterval = window.setInterval(startTone, 1_000);
    alarmTimeout = window.setTimeout(stopAlarm, 30_000);
  } catch {
    showStatus('Sound could not be started.');
  }
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

function closeAlert(): void {
  stopAlarm();
  window.close();
}

async function cancelCompletion(): Promise<void> {
  try {
    await send({ type: MESSAGE_TYPES.cancelCompletion });
    closeAlert();
  } catch (error: unknown) {
    showStatus(error instanceof Error ? error.message : 'Could not cancel the timer.', true);
  }
}

function showRestartOptions(snapshot: TimerSnapshot): void {
  selectedRestartMinutes = Math.round(snapshot.selectedDurationMs / 60_000);
  setSelectedRestartMinutes(selectedRestartMinutes);
  restartPanelElement.hidden = false;
  restartButtonElement.hidden = true;
  confirmRestartButtonElement.hidden = false;
  descriptionElement.textContent = 'Choose a duration before starting again.';
  stopAlarm();
}

async function restartCompletion(): Promise<void> {
  try {
    await send({ type: MESSAGE_TYPES.restart, durationMinutes: selectedRestartMinutes });
    closeAlert();
  } catch (error: unknown) {
    showStatus(error instanceof Error ? error.message : 'Could not restart the timer.', true);
  }
}

async function initialize(): Promise<void> {
  try {
    centerAlertWindow();
    const snapshot = await send({ type: MESSAGE_TYPES.getSnapshot });

    if (snapshot.state !== 'completed') {
      descriptionElement.textContent = 'The timer is no longer complete.';
      stopAlarm();
      return;
    }

    setSelectedRestartMinutes(Math.round(snapshot.selectedDurationMs / 60_000));
    startAlarm();
  } catch (error: unknown) {
    showStatus(error instanceof Error ? error.message : 'Could not load timer completion.', true);
  }
}

restartDurationDisplayElement.addEventListener('click', enterRestartDurationEditing);

restartDurationEditorElement.addEventListener('blur', confirmRestartDurationEditing);

restartDurationEditorElement.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    cancelRestartDurationEditing();
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    confirmRestartDurationEditing();
  }
});

restartQuickAccessElement.addEventListener('click', (event) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement) || target.dataset.minutes === undefined) {
    return;
  }

  if (editingRestartDuration) {
    confirmRestartDurationEditing();
    return;
  }

  setSelectedRestartMinutes(Number(target.dataset.minutes));
});

cancelButtonElement.addEventListener('click', () => {
  void cancelCompletion();
});

restartButtonElement.addEventListener('click', () => {
  void send({ type: MESSAGE_TYPES.getSnapshot })
    .then((snapshot) => showRestartOptions(snapshot))
    .catch((error: unknown) => {
      showStatus(error instanceof Error ? error.message : 'Could not prepare restart.', true);
    });
});

confirmRestartButtonElement.addEventListener('click', () => {
  void restartCompletion();
});

window.addEventListener('beforeunload', stopAlarm);

createQuickAccessButtons();
void initialize();
