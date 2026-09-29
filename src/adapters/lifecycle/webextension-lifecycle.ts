import type { BrowserApi } from '../browser/webextension-api';

export interface LifecyclePort {
  onInstalled(handler: () => void | Promise<void>): void;
}

export function createWebExtensionLifecycle(browserApi: BrowserApi): LifecyclePort {
  return {
    onInstalled(handler): void {
      browserApi.runtime.onInstalled.addListener(() => {
        void handler();
      });
    },
  };
}
