import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllEnvs());

it('imports the injected repository factory without DATABASE_URL', async () => {
  vi.stubEnv('DATABASE_URL', '');
  vi.resetModules();

  await expect(import('@/server/repositories/player-standard-data.repository'))
    .resolves.toHaveProperty('createPlayerStandardDataRepository');
});
