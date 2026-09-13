import { describe, expect, it } from 'vitest';
import {
  calculatePlanAtBoundary,
  type PlayerRepositoryRunner,
} from '@/server/actions/calculate-player-plan.boundary';
import type { PlayerStandardDataRepository } from '@/server/repositories/player-standard-data.repository';

const authorityReader: PlayerStandardDataRepository = {
  getCalculatorData: async () => null,
  getCalculationAuthority: async () => ({
    level: { number: 1, targetRevenue: 160 },
    foods: [{ id: 'food-1', name: '经典汉堡', categoryName: '汉堡', displayOrder: 1 }],
    souvenirs: [],
  }),
};

const withInjectedAuthority: PlayerRepositoryRunner = async <T>(work: (repository: PlayerStandardDataRepository) => Promise<T>) =>
  work(authorityReader);

describe('player calculator action boundary', () => {
  it('calculates a success result through the real boundary with injected authority', async () => {
    await expect(calculatePlanAtBoundary({
      city: 'new-york',
      levelNumber: '1',
      currentRevenue: '100',
      goldBudget: '0',
      diamondBudget: '0',
      preference: 'gold_first',
      foods: { 'food-1': { selected: true, revenueDelta: '60', goldCost: '0', diamondCost: '0' } },
      souvenirs: {},
    }, withInjectedAuthority)).resolves.toMatchObject({
      ok: true,
      data: {
        status: 'success',
        targetRevenue: 160,
        currentRevenue: 100,
        finalRevenue: 160,
        selectedFoods: [{ id: 'food-1', name: '经典汉堡', categoryName: '汉堡', revenueDelta: 60 }],
      },
    });
  });
});
