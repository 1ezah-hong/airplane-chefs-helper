import { describe, expect, it } from 'vitest';
import { calculateGap, enumerateFoodSubsets } from '@/domain/calculation/food-subsets';

const foods = [
  { id: 'later', name: 'Later', categoryName: '饮料', displayOrder: 2, revenueDelta: 70, goldCost: 4, diamondCost: 1 },
  { id: 'first', name: 'First', categoryName: '主食', displayOrder: 1, revenueDelta: 100, goldCost: 3, diamondCost: 2 },
] as const;

describe('food subsets', () => {
  it('calculates a non-negative revenue gap', () => {
    expect(calculateGap(1_000, 700)).toBe(300);
    expect(calculateGap(700, 1_000)).toBe(0);
  });

  it('enumerates every 0/1 food choice with exact totals and directory order', () => {
    expect([...enumerateFoodSubsets(foods)]).toEqual([
      { selectedFoods: [], addedRevenue: 0, goldCost: 0, diamondCost: 0 },
      { selectedFoods: [foods[1]], addedRevenue: 100, goldCost: 3, diamondCost: 2 },
      { selectedFoods: [foods[0]], addedRevenue: 70, goldCost: 4, diamondCost: 1 },
      { selectedFoods: [foods[1], foods[0]], addedRevenue: 170, goldCost: 7, diamondCost: 3 },
    ]);
  });

  it('yields the empty subset before a caller requests later subsets', () => {
    const iterator = enumerateFoodSubsets(foods);
    expect(iterator.next().value).toEqual({ selectedFoods: [], addedRevenue: 0, goldCost: 0, diamondCost: 0 });
  });
});
