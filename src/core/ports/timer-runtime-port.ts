export const TIMER_ALARM_NAME = 'render32_timer_completion';

export interface AlarmPort {
  schedule(name: string, whenMs: number): Promise<void>;
  clear(name: string): Promise<void>;
  onAlarm(handler: (name: string) => void | Promise<void>): void;
}

export interface BadgePort {
  setText(text: string): Promise<void>;
}

export interface CompletionAlertPort {
  open(): Promise<void>;
}

export interface OffscreenPort {
  start(endAtMs: number): Promise<void>;
  stop(): Promise<void>;
}
