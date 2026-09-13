import 'server-only';

import { createDatabase } from '@/db/client';
import { parseServerEnv } from '@/lib/env.schema';
import { createPlayerStandardDataRepository, type PlayerStandardDataRepository } from './player-standard-data.repository';

export async function withPlayerStandardDataRepository<T>(
  work: (repository: PlayerStandardDataRepository) => Promise<T>,
): Promise<T> {
  const { DATABASE_URL } = parseServerEnv(process.env);
  const database = createDatabase(DATABASE_URL);
  try {
    return await work(createPlayerStandardDataRepository(database));
  } finally {
    await database.close();
  }
}
