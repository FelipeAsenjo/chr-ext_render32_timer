import type { CompletionAlertPort } from '../../core/ports/timer-runtime-port';
import type { BrowserApi } from '../browser/webextension-api';

export function createWebExtensionCompletionAlert(browserApi: BrowserApi): CompletionAlertPort {
  return {
    async open(): Promise<void> {
      await browserApi.windows.create({
        focused: true,
        height: 480,
        type: 'popup',
        url: browserApi.runtime.getURL('src/alert/alert.html'),
        width: 420,
      });
    },
  };
}
