import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

import { parseServerEnv } from './src/lib/env.schema';

const env = parseServerEnv(process.env);

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
