import { config } from 'dotenv';
import { afterAll, describe, expect, it } from 'vitest';
import { createDatabase } from '@/db/client';

config({ path: '.env.local', quiet: true });

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error('Set TEST_DATABASE_URL to a dedicated test PostgreSQL database.');
}

const database = createDatabase(connectionString);

afterAll(async () => {
  await database.close();
});

describe('database client', () => {
  it('executes a parameterized PostgreSQL health query', async () => {
    const rows = await database.sql<{ value: number }[]>`select 1::int as value`;

    expect(rows).toEqual([{ value: 1 }]);
  });
});
