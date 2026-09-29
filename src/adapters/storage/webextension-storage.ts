import type { BrowserApi } from '../browser/webextension-api';
import type { StoragePort } from '../../core/ports/storage-port';

export function createWebExtensionStorage(browserApi: BrowserApi): StoragePort {
  return {
    async get<T>(key: string): Promise<T | undefined> {
      const result = await browserApi.storage.local.get(key);
      return result[key] as T | undefined;
    },

    async set<T>(key: string, value: T): Promise<void> {
      await browserApi.storage.local.set({ [key]: value });
    },
  };
}
