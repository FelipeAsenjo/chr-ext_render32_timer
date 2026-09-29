import type { AlarmPort } from '../../core/ports/timer-runtime-port';
import type { BrowserApi } from '../browser/webextension-api';

export function createWebExtensionAlarm(browserApi: BrowserApi): AlarmPort {
  return {
    async schedule(name, whenMs): Promise<void> {
      await browserApi.alarms.create(name, { when: whenMs });
    },

    async clear(name): Promise<void> {
      await browserApi.alarms.clear(name);
    },

    onAlarm(handler): void {
      browserApi.alarms.onAlarm.addListener((alarm) => {
        void handler(alarm.name);
      });
    },
  };
}
