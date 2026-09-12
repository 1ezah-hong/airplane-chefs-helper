import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './schema';

export function createDatabase(connectionString: string) {
  const sql = postgres(connectionString, {
    max: 1,
    prepare: false,
  });

  return {
    db: drizzle(sql, { schema }),
    sql,
    close: () => sql.end({ timeout: 5 }),
  };
}

export type DatabaseHandle = ReturnType<typeof createDatabase>;
