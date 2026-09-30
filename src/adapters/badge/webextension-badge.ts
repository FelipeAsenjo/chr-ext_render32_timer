import type { BadgePort } from '../../core/ports/timer-runtime-port';
import type { BrowserApi } from '../browser/webextension-api';

const BADGE_BACKGROUND_COLOR = '#E21D3F';

export function createWebExtensionBadge(browserApi: BrowserApi): BadgePort {
  let backgroundConfigured = false;

  return {
    async setText(text): Promise<void> {
      if (!backgroundConfigured) {
        await browserApi.action.setBadgeBackgroundColor({ color: BADGE_BACKGROUND_COLOR });
        backgroundConfigured = true;
      }

      await browserApi.action.setBadgeText({ text });
    },
  };
}
