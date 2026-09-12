import { describe, expect, it } from 'vitest';
import { calculateOptimalPlan } from '@/domain/calculation';
import type { CalculationInput } from '@/domain/calculation';
import { CalculationInputError } from '@/domain/calculation/validation';

const base = (): CalculationInput => ({
  targetRevenue: 1_000, currentRevenue: 700, goldBudget: 20, diamondBudget: 5, preference: 'gold_first',
  foods: [
    { id: 'a', name: 'A', categoryName: '主食', displayOrder: 1, revenueDelta: 300, goldCost: 10, diamondCost: 5 },
    { id: 'b', name: 'B', categoryName: '饮料', displayOrder: 2, revenueDelta: 300, goldCost: 11, diamondCost: 0 },
  ],
  souvenirs: [],
});

describe('calculateOptimalPlan', () => {
  it('includes budget-feasible food-only revenue in the no-solution maximum', () => {
    expect(calculateOptimalPlan({
      ...base(), targetRevenue: 1_000, currentRevenue: 0,
    })).toEqual({
      status: 'no_solution', targetRevenue: 1_000, currentRevenue: 0, gap: 1_000,
      preference: 'gold_first', maxAdditionalRevenue: 300,
    });
  });

  it('validates input even when revenue already meets the target', () => {
    expect(() => calculateOptimalPlan({ ...base(), currentRevenue: 1_000, goldBudget: -1 })).toThrow(CalculationInputError);
  });

  it('rejects unsafe final revenue arithmetic as a domain input error', () => {
    expect(() => calculateOptimalPlan({
      ...base(), targetRevenue: Number.MAX_SAFE_INTEGER, currentRevenue: Number.MAX_SAFE_INTEGER - 1,
      foods: [{ ...base().foods[0], revenueDelta: 2 }],
    })).toThrow(CalculationInputError);
  });

  it.each(['gold_first', 'diamond_first'] as const)('uses the secondary resource before directory order for %s', (preference) => {
    const costs = preference === 'gold_first'
      ? [{ goldCost: 1, diamondCost: 0 }, { goldCost: 1, diamondCost: 1 }]
      : [{ goldCost: 0, diamondCost: 1 }, { goldCost: 1, diamondCost: 1 }];
    expect(calculateOptimalPlan({
      ...base(), preference,
      foods: base().foods.map((food, index) => ({ ...food, ...costs[index] })),
    })).toMatchObject({ status: 'success', selectedFoods: [{ id: 'a' }] });
  });

  it('combines food and both inventories within their shared diamond budget', () => {
    const value: CalculationInput = {
      targetRevenue: 330, currentRevenue: 0, goldBudget: 1, diamondBudget: 1, preference: 'gold_first',
      foods: [{ ...base().foods[0], revenueDelta: 200, goldCost: 1, diamondCost: 1 }],
      souvenirs: [
        { slot: 2, name: 'B', inventory: 1, perItemRevenue: 70, packageSize: 5, diamondPackagePrice: 2 },
        { slot: 1, name: 'A', inventory: 1, perItemRevenue: 60, packageSize: 5, diamondPackagePrice: 2 },
      ],
    };
    const before = structuredClone(value);
    Object.freeze(value.foods); Object.freeze(value.souvenirs); Object.freeze(value);
    expect(calculateOptimalPlan(value)).toMatchObject({
      status: 'success', selectedFoods: [{ id: 'a' }],
      souvenirUses: [{ slot: 1, quantityUsed: 1 }, { slot: 2, quantityUsed: 1 }],
      addedRevenue: 330, goldCost: 1, diamondCost: 1, goldBudgetRemaining: 0, diamondBudgetRemaining: 0,
    });
    expect(value).toEqual(before);
    expect(calculateOptimalPlan(value)).toEqual(calculateOptimalPlan({ ...value, souvenirs: [...value.souvenirs].reverse() }));
  });

  it('prefers fewer foods even when that uses more souvenirs at equal costs', () => {
    expect(calculateOptimalPlan({
      ...base(), targetRevenue: 100, currentRevenue: 0, goldBudget: 0, diamondBudget: 0,
      foods: [{ ...base().foods[0], revenueDelta: 100, goldCost: 0, diamondCost: 0 }],
      souvenirs: [{ slot: 1, name: 'A', inventory: 2, perItemRevenue: 50, packageSize: 5, diamondPackagePrice: 1 }],
    })).toMatchObject({ status: 'success', selectedFoods: [], souvenirUses: [{ slot: 1, quantityUsed: 2 }] });
  });

  it('omits every unused souvenir when food alone fills the gap', () => {
    expect(calculateOptimalPlan({
      ...base(), foods: [base().foods[0]],
      souvenirs: [{ slot: 1, name: 'A', inventory: 0, perItemRevenue: 50, packageSize: 5, diamondPackagePrice: 10 }],
    })).toMatchObject({ status: 'success', souvenirUses: [] });
  });
  it('returns already_starred without a plan when current revenue equals the target', () => {
    const value = base(); value.currentRevenue = 1_000;
    expect(calculateOptimalPlan(value)).toEqual({ status: 'already_starred', targetRevenue: 1_000, currentRevenue: 1_000, gap: 0, preference: 'gold_first' });
  });

  it('selects the gold-minimum feasible food plan and returns stable resource totals', () => {
    expect(calculateOptimalPlan(base())).toMatchObject({
      status: 'success', selectedFoods: [{ id: 'a' }], addedRevenue: 300, finalRevenue: 1_000,
      revenueOverTarget: 0, goldCost: 10, diamondCost: 5, goldBudgetRemaining: 10, diamondBudgetRemaining: 0,
    });
  });

  it('switches the first lexicographic resource when diamond_first is selected', () => {
    const value = base(); value.preference = 'diamond_first';
    expect(calculateOptimalPlan(value)).toMatchObject({ status: 'success', selectedFoods: [{ id: 'b' }], goldCost: 11, diamondCost: 0 });
  });

  it('minimizes selected food count after both resource costs tie', () => {
    expect(calculateOptimalPlan({
      targetRevenue: 100, currentRevenue: 0, goldBudget: null, diamondBudget: null, preference: 'gold_first', souvenirs: [],
      foods: [
        { id: 'one', name: 'One', categoryName: '主食', displayOrder: 1, revenueDelta: 100, goldCost: 1, diamondCost: 1 },
        { id: 'two-a', name: 'Two A', categoryName: '饮料', displayOrder: 2, revenueDelta: 50, goldCost: 1, diamondCost: 0 },
        { id: 'two-b', name: 'Two B', categoryName: '饮料', displayOrder: 3, revenueDelta: 50, goldCost: 0, diamondCost: 1 },
      ],
    })).toMatchObject({ status: 'success', selectedFoods: [{ id: 'one' }] });
  });

  it('returns finite no_solution maximum additional revenue when budgets cannot fill the gap', () => {
    const value = base(); value.goldBudget = 9; value.diamondBudget = 0;
    expect(calculateOptimalPlan(value)).toEqual({ status: 'no_solution', targetRevenue: 1_000, currentRevenue: 700, gap: 300, preference: 'gold_first', maxAdditionalRevenue: 0 });
  });

  it('accepts a cost exactly equal to both entered budgets', () => {
    expect(calculateOptimalPlan({
      targetRevenue: 100, currentRevenue: 0, goldBudget: 5, diamondBudget: 2, preference: 'gold_first', souvenirs: [],
      foods: [{ id: 'exact', name: 'Exact', categoryName: '主食', displayOrder: 1, revenueDelta: 100, goldCost: 5, diamondCost: 2 }],
    })).toMatchObject({ status: 'success', goldBudgetRemaining: 0, diamondBudgetRemaining: 0 });
  });

  it('rejects a plan whose gold cost exceeds the entered budget by one', () => {
    expect(calculateOptimalPlan({
      targetRevenue: 100, currentRevenue: 0, goldBudget: 4, diamondBudget: 2, preference: 'gold_first', souvenirs: [],
      foods: [{ id: 'over', name: 'Over', categoryName: '主食', displayOrder: 1, revenueDelta: 100, goldCost: 5, diamondCost: 2 }],
    })).toMatchObject({ status: 'no_solution', maxAdditionalRevenue: 0 });
  });

  it('enumerates both souvenir slots and uses the lower-quantity equally priced solution', () => {
    const result = calculateOptimalPlan({
      targetRevenue: 130, currentRevenue: 0, goldBudget: 0, diamondBudget: 1, preference: 'diamond_first', foods: [],
      souvenirs: [
        { slot: 1, name: '自由帽', inventory: 0, perItemRevenue: 60, packageSize: 5, diamondPackagePrice: 1 },
        { slot: 2, name: '苹果徽章', inventory: 0, perItemRevenue: 70, packageSize: 5, diamondPackagePrice: 1 },
      ],
    });
    expect(result).toMatchObject({ status: 'success', souvenirUses: [{ slot: 2, quantityUsed: 2 }], diamondCost: 1 });
  });

  it('does not buy a package when quantity used equals inventory', () => {
    const result = calculateOptimalPlan({
      targetRevenue: 120, currentRevenue: 0, goldBudget: 0, diamondBudget: 0, preference: 'diamond_first', foods: [],
      souvenirs: [{ slot: 1, name: '自由帽', inventory: 2, perItemRevenue: 60, packageSize: 5, diamondPackagePrice: 1 }],
    });
    expect(result).toMatchObject({ status: 'success', souvenirUses: [{ quantityUsed: 2, packagesPurchased: 0, quantityPurchased: 0, remainingAfterPurchase: 0 }] });
  });

  it('buys one package when quantity used is inventory plus one', () => {
    const result = calculateOptimalPlan({
      targetRevenue: 180, currentRevenue: 0, goldBudget: 0, diamondBudget: 1, preference: 'diamond_first', foods: [],
      souvenirs: [{ slot: 1, name: '自由帽', inventory: 2, perItemRevenue: 60, packageSize: 5, diamondPackagePrice: 1 }],
    });
    expect(result).toMatchObject({ status: 'success', souvenirUses: [{ quantityUsed: 3, packagesPurchased: 1, quantityPurchased: 5, remainingAfterPurchase: 4 }] });
  });

  it('uses a zero-price souvenir with a finite zero diamond budget', () => {
    expect(calculateOptimalPlan({
      targetRevenue: 300, currentRevenue: 0, goldBudget: 0, diamondBudget: 0, preference: 'diamond_first', foods: [],
      souvenirs: [{ slot: 1, name: '免费', inventory: 0, perItemRevenue: 60, packageSize: 5, diamondPackagePrice: 0 }],
    })).toMatchObject({ status: 'success', diamondCost: 0, diamondBudgetRemaining: 0, souvenirUses: [{ quantityUsed: 5 }] });
  });

  it('returns success for positive-revenue souvenirs when diamond budget is unlimited', () => {
    expect(calculateOptimalPlan({
      targetRevenue: 1_000, currentRevenue: 0, goldBudget: 0, diamondBudget: null, preference: 'gold_first', foods: [],
      souvenirs: [{ slot: 2, name: '苹果徽章', inventory: 0, perItemRevenue: 130, packageSize: 5, diamondPackagePrice: 2 }],
    })).toMatchObject({ status: 'success', finalRevenue: 1_040, diamondBudgetRemaining: null });
  });

  it('returns already_starred when current revenue is above the target', () => {
    const value = base(); value.currentRevenue = 1_001;
    expect(calculateOptimalPlan(value)).toMatchObject({ status: 'already_starred', gap: 0 });
  });

  it('reports the finite maximum additional revenue from a mixed two-slot no-solution candidate', () => {
    expect(calculateOptimalPlan({
      targetRevenue: 2_000, currentRevenue: 0, goldBudget: 0, diamondBudget: 1, preference: 'diamond_first', foods: [],
      souvenirs: [
        { slot: 1, name: 'A', inventory: 3, perItemRevenue: 100, packageSize: 5, diamondPackagePrice: 1 },
        { slot: 2, name: 'B', inventory: 3, perItemRevenue: 150, packageSize: 5, diamondPackagePrice: 1 },
      ],
    })).toEqual({ status: 'no_solution', targetRevenue: 2_000, currentRevenue: 0, gap: 2_000, preference: 'diamond_first', maxAdditionalRevenue: 1_500 });
  });

  it('is deterministic when equivalent food input arrives in a different array order', () => {
    const common = { targetRevenue: 100, currentRevenue: 0, goldBudget: null, diamondBudget: null, preference: 'gold_first' as const, souvenirs: [] };
    const one = { id: 'one', name: 'One', categoryName: '主食', displayOrder: 1, revenueDelta: 100, goldCost: 1, diamondCost: 1 };
    const two = { id: 'two', name: 'Two', categoryName: '饮料', displayOrder: 2, revenueDelta: 100, goldCost: 1, diamondCost: 1 };
    expect(calculateOptimalPlan({ ...common, foods: [one, two] })).toEqual(calculateOptimalPlan({ ...common, foods: [two, one] }));
  });
});
