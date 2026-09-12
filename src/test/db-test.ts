import { createDatabase, type DatabaseHandle } from '@/db/client';

export function getTestDatabase(): DatabaseHandle {
  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error('Set TEST_DATABASE_URL to a dedicated test PostgreSQL database.');
  }

  return createDatabase(connectionString);
}

export async function truncateStandardData(database: DatabaseHandle): Promise<void> {
  await database.sql.unsafe(
    'TRUNCATE TABLE foods, souvenirs, food_categories, levels, airports RESTART IDENTITY CASCADE',
  );
}
