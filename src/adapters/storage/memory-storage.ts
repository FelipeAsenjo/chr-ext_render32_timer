import type { StoragePort } from '../../core/ports/storage-port';

/** A deterministic adapter for unit tests and local core experiments. */
export function createMemoryStorage(initialValues: Record<string, unknown> = {}): StoragePort {
  const values = new Map<string, unknown>(Object.entries(initialValues));

  return {
    get<T>(key: string): Promise<T | undefined> {
      return Promise.resolve(values.get(key) as T | undefined);
    },

    set<T>(key: string, value: T): Promise<void> {
      values.set(key, value);
      return Promise.resolve();
    },
  };
}
