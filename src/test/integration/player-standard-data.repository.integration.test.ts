import path from 'node:path';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { levels } from '@/db/schema';
import { loadNewYorkStandardData } from '@/db/seed/new-york-standard-data';
import { seedNewYorkStandardData } from '@/db/seed/seed';
import { getTestDatabase, truncateStandardData } from '@/test/db-test';
import {
  createPlayerStandardDataRepository,
  PlayerStandardDataNotFoundError,
} from '@/server/repositories/player-standard-data.repository';

const database = getTestDatabase();
const repository = createPlayerStandardDataRepository(database);

beforeEach(async () => {
  await truncateStandardData(database);
  await seedNewYorkStandardData(
    database,
    loadNewYorkStandardData(path.join(process.cwd(), 'data', 'new-york-standard-data.json')),
  );
});

afterAll(async () => database.close());

describe('Player standard data repository', () => {
  it('returns only complete ordered calculator data and resolves selected authority', async () => {
    const data = await repository.getCalculatorData('new-york');
    expect(data).toMatchObject({
      city: 'new-york',
      levels: [{ number: 1, targetRevenue: 160 }],
      foods: [{ name: '泡菜', categoryName: '配菜', displayOrder: 1 }],
      souvenirs: [{ slot: 1, name: '自由帽' }, { slot: 2, name: '苹果徽章' }],
    });
    if (!data?.foods[0] || !data.souvenirs[0]) throw new Error('Expected seeded authority');

    await expect(repository.getCalculationAuthority({
      city: 'new-york',
      levelNumber: 1,
      foodIds: [data.foods[0].id],
      souvenirIds: [data.souvenirs[0].id],
    })).resolves.toMatchObject({
      level: { number: 1, targetRevenue: 160 },
      foods: [{ id: data.foods[0].id, name: '泡菜', categoryName: '配菜' }],
      souvenirs: [{ id: data.souvenirs[0].id, slot: 1, name: '自由帽' }],
    });
  });

  it('treats a missing standard level as unavailable calculator data', async () => {
    await database.db.delete(levels).where(eq(levels.levelNumber, 2));

    await expect(repository.getCalculatorData('new-york')).resolves.toBeNull();
  });

  it('rejects duplicate or unknown selected IDs', async () => {
    const data = await repository.getCalculatorData('new-york');
    if (!data?.foods[0]) throw new Error('Expected seeded food');

    await expect(repository.getCalculationAuthority({
      city: 'new-york',
      levelNumber: 1,
      foodIds: [data.foods[0].id, data.foods[0].id],
      souvenirIds: [],
    })).rejects.toBeInstanceOf(PlayerStandardDataNotFoundError);

    await expect(repository.getCalculationAuthority({
      city: 'new-york',
      levelNumber: 1,
      foodIds: ['00000000-0000-0000-0000-000000000000'],
      souvenirIds: [],
    })).rejects.toBeInstanceOf(PlayerStandardDataNotFoundError);
  });
});
