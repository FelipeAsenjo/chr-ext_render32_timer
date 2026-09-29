/**
 * The persistence contract required by the application core.
 *
 * The core deliberately knows nothing about browser storage. This interface
 * lets production and test environments provide different implementations.
 */
export interface StoragePort {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}
