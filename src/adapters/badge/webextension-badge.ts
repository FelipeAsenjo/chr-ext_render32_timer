import type { BadgePort } from '../../core/ports/timer-runtime-port';
import type { BrowserApi } from '../browser/webextension-api';

export function createWebExtensionBadge(browserApi: BrowserApi): BadgePort {
  return {
    async setText(text): Promise<void> {
      await browserApi.action.setBadgeText({ text });
    },
  };
}
