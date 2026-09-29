import { createStatusService } from '../core/application/status-service';
import { MESSAGE_TYPES } from '../core/ports/message-port';
import browser from '../adapters/browser/webextension-api';
import { createWebExtensionLifecycle } from '../adapters/lifecycle/webextension-lifecycle';
import { createWebExtensionMessaging } from '../adapters/messaging/webextension-messaging';
import { createWebExtensionStorage } from '../adapters/storage/webextension-storage';

const storage = createWebExtensionStorage(browser);
const statusService = createStatusService({ storage });
const lifecycle = createWebExtensionLifecycle(browser);
const messaging = createWebExtensionMessaging(browser);

// Register listeners synchronously so event-based browsers can restore them
// when the background context is started again.
lifecycle.onInstalled(() => statusService.initialize());

messaging.onMessage(async (message) => {
  if (message.type === MESSAGE_TYPES.getStatus) {
    return statusService.getStatus();
  }

  if (message.type === MESSAGE_TYPES.setStatus) {
    return statusService.setStatus(message.enabled);
  }

  if (message.type === MESSAGE_TYPES.ping) {
    return { ok: true };
  }

  const exhaustiveMessage: never = message;
  return exhaustiveMessage;
});
