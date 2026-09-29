import browser from '../adapters/browser/webextension-api';
import { MESSAGE_TYPES } from '../core/ports/message-port';

// Content scripts should communicate through extension messaging instead of
// placing globals on the host page, which may belong to an unrelated app.
void browser.runtime.sendMessage({ type: MESSAGE_TYPES.ping }).catch(() => {
  // The background context can be unavailable briefly while the extension reloads.
});
