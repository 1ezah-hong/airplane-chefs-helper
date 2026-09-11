import 'dotenv/config';

import path from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { parseServerEnv } from '../lib/env.schema';
import { createDatabase } from './client';

export async function runMigrations(connectionString: string): Promise<void> {
  const database = createDatabase(connectionString);

  try {
    await migrate(database.db, {
      migrationsFolder: path.join(process.cwd(), 'src/db/migrations'),
    });
  } finally {
    await database.close();
  }
}

void runMigrations(parseServerEnv(process.env).DATABASE_URL);
