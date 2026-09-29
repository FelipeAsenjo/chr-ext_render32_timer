import { describe, expect, it } from 'vitest';
import { createStatusService } from '../src/core/application/status-service';
import { createMemoryStorage } from '../src/adapters/storage/memory-storage';

describe('status service', () => {
  it('initializes the default enabled status', async () => {
    const service = createStatusService({ storage: createMemoryStorage() });

    await service.initialize();

    await expect(service.getStatus()).resolves.toEqual({ enabled: true });
  });

  it('updates and reads the enabled status', async () => {
    const service = createStatusService({ storage: createMemoryStorage() });

    await expect(service.setStatus(false)).resolves.toEqual({ enabled: false });
    await expect(service.getStatus()).resolves.toEqual({ enabled: false });
  });
});
