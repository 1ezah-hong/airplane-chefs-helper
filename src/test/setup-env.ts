import { beforeEach } from 'vitest';

beforeEach(() => {
  delete process.env.DATABASE_URL;
});
