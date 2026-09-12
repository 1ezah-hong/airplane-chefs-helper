import { describe, expect, it } from 'vitest';
import { calculateGap, enumerateFoodSubsets } from '@/domain/calculation/food-subsets';
import { CalculationInputError } from '@/domain/calculation/integers';

const foods = [
  { id: 'later', name: 'Later', categoryName: '饮料', displayOrder: 2, revenueDelta: 70, goldCost: 4, diamondCost: 1 },
  { id: 'first', name: 'First', categoryName: '主食', displayOrder: 1, revenueDelta: 100, goldCost: 3, diamondCost: 2 },
] as const;

describe('food subsets', () => {
  it('calculates a non-negative revenue gap', () => {
    expect(calculateGap(1_000, 700)).toBe(300);
    expect(calculateGap(700, 1_000)).toBe(0);
  });

  it('rejects unsafe revenue inputs even when their ordering would return a zero gap', () => {
    const unsafeRevenue = Number.MAX_SAFE_INTEGER + 1;
    expect(() => calculateGap(unsafeRevenue, unsafeRevenue)).toThrow(CalculationInputError);
  });

  it('rejects direct enumeration calls with more than twenty foods', () => {
    const tooManyFoods = Array.from({ length: 21 }, (_, index) => ({
      id: `food-${index}`,
      name: `Food ${index}`,
      categoryName: '主食',
      displayOrder: index,
      revenueDelta: 1,
      goldCost: 1,
      diamondCost: 0,
    }));

    expect(() => enumerateFoodSubsets(tooManyFoods).next()).toThrow(CalculationInputError);
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

  it('does not evaluate later-subset revenue or costs when yielding the first subset', () => {
    const laterFood = {
      ...foods[0],
      get revenueDelta(): number {
        throw new Error('later food revenue should remain unevaluated');
      },
      get goldCost(): number {
        throw new Error('later food gold cost should remain unevaluated');
      },
      get diamondCost(): number {
        throw new Error('later food diamond cost should remain unevaluated');
      },
    };
    const iterator = enumerateFoodSubsets([laterFood]);

    expect(iterator.next().value).toEqual({ selectedFoods: [], addedRevenue: 0, goldCost: 0, diamondCost: 0 });
    expect(() => iterator.next()).toThrow('later food revenue should remain unevaluated');
  });
});
