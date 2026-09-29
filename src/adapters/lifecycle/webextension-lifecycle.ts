import type { BrowserApi } from '../browser/webextension-api';

export interface LifecyclePort {
  onInstalled(handler: () => void | Promise<void>): void;
  onStartup(handler: () => void | Promise<void>): void;
}

export function createWebExtensionLifecycle(browserApi: BrowserApi): LifecyclePort {
  return {
    onInstalled(handler): void {
      browserApi.runtime.onInstalled.addListener(() => {
        void handler();
      });
    },

    onStartup(handler): void {
      browserApi.runtime.onStartup.addListener(() => {
        void handler();
      });
    },
  };
}
