import path from 'node:path';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { airports, foodCategories, foods, levels, souvenirs } from '@/db/schema';
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

  it('keeps an empty food catalog valid for souvenir-only calculation', async () => {
    await database.db.delete(foods);

    await expect(repository.getCalculatorData('new-york')).resolves.toMatchObject({ foods: [] });
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

  it('rejects a deleted souvenir ID', async () => {
    const data = await repository.getCalculatorData('new-york');
    if (!data?.souvenirs[0]) throw new Error('Expected seeded souvenir');
    await database.db.delete(souvenirs).where(eq(souvenirs.id, data.souvenirs[0].id));

    await expect(repository.getCalculationAuthority({
      city: 'new-york',
      levelNumber: 1,
      foodIds: [],
      souvenirIds: [data.souvenirs[0].id],
    })).rejects.toBeInstanceOf(PlayerStandardDataNotFoundError);
  });

  it('rejects food and souvenir IDs from another airport', async () => {
    const [airport] = await database.db.insert(airports)
      .values({ slug: 'other-airport', displayName: '其他机场' })
      .returning({ id: airports.id });
    if (!airport) throw new Error('Expected other airport');
    const [category] = await database.db.insert(foodCategories)
      .values({ airportId: airport.id, name: '其他分类', nameKey: '其他分类' })
      .returning({ id: foodCategories.id });
    if (!category) throw new Error('Expected other category');
    const [food] = await database.db.insert(foods)
      .values({ airportId: airport.id, categoryId: category.id, name: '其他食物', nameKey: '其他食物', displayOrder: 1 })
      .returning({ id: foods.id });
    const [souvenir] = await database.db.insert(souvenirs)
      .values({ airportId: airport.id, slot: 1, name: '其他纪念品', perItemRevenue: 1, packageSize: 5, diamondPackagePrice: 0 })
      .returning({ id: souvenirs.id });
    if (!food || !souvenir) throw new Error('Expected other authority');

    await expect(repository.getCalculationAuthority({
      city: 'new-york',
      levelNumber: 1,
      foodIds: [food.id],
      souvenirIds: [],
    })).rejects.toBeInstanceOf(PlayerStandardDataNotFoundError);
    await expect(repository.getCalculationAuthority({
      city: 'new-york',
      levelNumber: 1,
      foodIds: [],
      souvenirIds: [souvenir.id],
    })).rejects.toBeInstanceOf(PlayerStandardDataNotFoundError);
  });
});
