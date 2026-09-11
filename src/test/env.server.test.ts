import { describe, expect, it } from 'vitest';
import { parseServerEnv } from '@/lib/env.schema';

describe('parseServerEnv', () => {
  it('accepts a PostgreSQL connection URL', () => {
    expect(
      parseServerEnv({
        DATABASE_URL: 'postgresql://user:password@db.example.test:5432/chc',
      }),
    ).toEqual({
      DATABASE_URL: 'postgresql://user:password@db.example.test:5432/chc',
    });
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => parseServerEnv({})).toThrow('DATABASE_URL');
  });

  it('rejects a non-PostgreSQL URL', () => {
    expect(() =>
      parseServerEnv({ DATABASE_URL: 'https://db.example.test' }),
    ).toThrow('postgresql://');
  });
});
