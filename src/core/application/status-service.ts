import { STORAGE_KEYS, type StoragePort } from '../ports/storage-port';

const DEFAULT_ENABLED = true;

export interface ExtensionStatus {
  readonly enabled: boolean;
}

export interface StatusService {
  initialize(): Promise<void>;
  getStatus(): Promise<ExtensionStatus>;
  setStatus(enabled: boolean): Promise<ExtensionStatus>;
}

/**
 * Creates the application use case without importing browser APIs.
 *
 * Keeping this function pure at the boundary makes it straightforward to
 * test the behavior with an in-memory storage adapter.
 */
export function createStatusService({ storage }: { storage: StoragePort }): StatusService {
  return {
    async initialize(): Promise<void> {
      const enabled = await storage.get<boolean>(STORAGE_KEYS.enabled);

      if (enabled === undefined) {
        await storage.set(STORAGE_KEYS.enabled, DEFAULT_ENABLED);
      }
    },

    async getStatus(): Promise<ExtensionStatus> {
      const enabled = await storage.get<boolean>(STORAGE_KEYS.enabled);
      return { enabled: enabled ?? DEFAULT_ENABLED };
    },

    async setStatus(enabled: boolean): Promise<ExtensionStatus> {
      const nextEnabled = Boolean(enabled);
      await storage.set(STORAGE_KEYS.enabled, nextEnabled);
      return { enabled: nextEnabled };
    },
  };
}
