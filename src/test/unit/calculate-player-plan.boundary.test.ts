import { describe, expect, it } from 'vitest';
import { PlayerStandardDataNotFoundError, type PlayerStandardDataRepository } from '@/server/repositories/player-standard-data.repository';
import { calculatePlanAtBoundary, type PlayerRepositoryRunner } from '@/server/actions/calculate-player-plan.boundary';
import { calculatePlayerPlan } from '@/server/services/calculate-player-plan';

const authority = {
  level: { number: 1, targetRevenue: 160 },
  foods: [{ id: 'food-1', name: '服务器食物', categoryName: '服务器分类', displayOrder: 1 }],
  souvenirs: [{
    id: 'souvenir-1',
    slot: 1 as const,
    name: '服务器纪念品',
    perItemRevenue: 60,
    packageSize: 5 as const,
    diamondPackagePrice: 1,
  }],
};

const repository: PlayerStandardDataRepository = {
  getCalculatorData: async () => null,
  getCalculationAuthority: async (selection) => ({
    level: authority.level,
    foods: authority.foods.filter((food) => selection.foodIds.includes(food.id)),
    souvenirs: authority.souvenirs.filter((souvenir) => selection.souvenirIds.includes(souvenir.id)),
  }),
};
const runWithRepository: PlayerRepositoryRunner = async <T>(work: (reader: PlayerStandardDataRepository) => Promise<T>) =>
  work(repository);

const rawRequest = {
  city: 'new-york',
  levelNumber: '1',
  currentRevenue: '100',
  goldBudget: '',
  diamondBudget: '',
  preference: 'gold_first',
  foods: {},
  souvenirs: {},
};

describe('player calculation service and boundary', () => {
  it('reports no selected candidate as a normal validation error after authority resolution', async () => {
    await expect(calculatePlanAtBoundary(rawRequest, runWithRepository)).resolves.toEqual({
      ok: false,
      error: {
        code: 'ValidationError',
        message: '当前收入未达标时，至少选择一种食物或纪念品。',
      },
    });
  });

  it('adapts direct service input using only resolved authority fields', async () => {
    await expect(calculatePlayerPlan({
      city: 'new-york',
      levelNumber: 1,
      currentRevenue: 100,
      goldBudget: 0,
      diamondBudget: 0,
      preference: 'gold_first',
      foods: [{ id: 'food-1', revenueDelta: 60, goldCost: 0, diamondCost: 0 }],
      souvenirs: [],
    }, repository)).resolves.toMatchObject({
      status: 'success',
      targetRevenue: 160,
      selectedFoods: [{
        id: 'food-1',
        name: '服务器食物',
        categoryName: '服务器分类',
        displayOrder: 1,
        revenueDelta: 60,
        goldCost: 0,
        diamondCost: 0,
      }],
    });
  });

  it('maps authority and unexpected failures to the Action envelope', async () => {
    const notFound: PlayerRepositoryRunner = async () => {
      throw new PlayerStandardDataNotFoundError();
    };
    const internal: PlayerRepositoryRunner = async () => {
      throw new Error('connection detail must not escape');
    };
    const selectedFood = {
      ...rawRequest,
      foods: { 'food-1': { selected: true, revenueDelta: '60', goldCost: '0', diamondCost: '0' } },
    };

    await expect(calculatePlanAtBoundary(selectedFood, notFound)).resolves.toEqual({
      ok: false,
      error: { code: 'NotFound', message: '标准数据已更新，请刷新后重试' },
    });
    await expect(calculatePlanAtBoundary(selectedFood, internal)).resolves.toEqual({
      ok: false,
      error: { code: 'InternalError', message: '暂时无法计算，请重试。' },
    });
  });
});
