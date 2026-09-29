import browser from '../adapters/browser/webextension-api';
import { createWebExtensionMessaging } from '../adapters/messaging/webextension-messaging';

export const extensionClient = createWebExtensionMessaging(browser);
