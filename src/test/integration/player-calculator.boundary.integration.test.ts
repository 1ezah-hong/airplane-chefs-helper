import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { getTestDatabase, truncateStandardData } from '@/test/db-test';
import { loadNewYorkStandardData } from '@/db/seed/new-york-standard-data';
import { seedNewYorkStandardData } from '@/db/seed/seed';
import {
  createPlayerStandardDataRepository,
  type PlayerStandardDataRepository,
} from '@/server/repositories/player-standard-data.repository';
import {
  calculatePlanAtBoundary,
  type PlayerRepositoryRunner,
} from '@/server/actions/calculate-player-plan.boundary';

const database = getTestDatabase();
const runWithTestRepository: PlayerRepositoryRunner = async <T>(work: (repository: PlayerStandardDataRepository) => Promise<T>) =>
  work(createPlayerStandardDataRepository(database));

beforeEach(async () => {
  await truncateStandardData(database);
  await seedNewYorkStandardData(
    database,
    loadNewYorkStandardData(path.join(process.cwd(), 'data', 'new-york-standard-data.json')),
  );
});

afterAll(async () => database.close());

describe('calculatePlanAtBoundary', () => {
  it('re-reads target and food authority while retaining player-owned food values', async () => {
    const repository = createPlayerStandardDataRepository(database);
    const data = await repository.getCalculatorData('new-york');
    if (!data) throw new Error('Expected seeded calculator data');
    const food = data.foods[0];
    if (!food) throw new Error('Expected seeded food');

    const state = await calculatePlanAtBoundary({
      city: 'new-york',
      levelNumber: '1',
      currentRevenue: '100',
      goldBudget: '0',
      diamondBudget: '0',
      preference: 'gold_first',
      targetRevenue: '999999',
      foods: {
        [food.id]: {
          selected: true,
          revenueDelta: '60',
          goldCost: '0',
          diamondCost: '0',
          name: 'forged',
          categoryName: 'forged',
          displayOrder: 999,
        },
      },
      souvenirs: {},
    }, runWithTestRepository);

    expect(state).toMatchObject({
      ok: true,
      data: {
        status: 'success',
        targetRevenue: 160,
        selectedFoods: [{
          id: food.id,
          name: food.name,
          categoryName: food.categoryName,
          displayOrder: food.displayOrder,
          revenueDelta: 60,
          goldCost: 0,
          diamondCost: 0,
        }],
      },
    });
  });
});
