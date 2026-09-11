import { z } from 'zod';

const databaseUrl = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'DATABASE_URL must use postgres:// or postgresql://',
  );

const serverEnvSchema = z.object({
  DATABASE_URL: databaseUrl,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(input: NodeJS.ProcessEnv): ServerEnv;
export function parseServerEnv(input: { DATABASE_URL?: string }): ServerEnv;
export function parseServerEnv(input: unknown): ServerEnv {
  return serverEnvSchema.parse(input);
}
