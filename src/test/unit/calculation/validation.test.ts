import { describe, expect, it } from 'vitest';
import { assertCalculationInput, CalculationInputError } from '@/domain/calculation/validation';
import { addSafeIntegers, multiplySafeIntegers } from '@/domain/calculation/integers';
import type { CalculationInput } from '@/domain/calculation/types';

const input = (): CalculationInput => ({
  targetRevenue: 1_000, currentRevenue: 500, goldBudget: null, diamondBudget: 10,
  preference: 'gold_first',
  foods: [{ id: 'food-a', name: 'A', categoryName: '主食', displayOrder: 1, revenueDelta: 100, goldCost: 20, diamondCost: 0 }],
  souvenirs: [{ slot: 1, name: '自由帽', inventory: 0, perItemRevenue: 60, packageSize: 5, diamondPackagePrice: 1 }],
});

describe('assertCalculationInput', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, 1.5, -1, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid numeric value %p', (currentRevenue) => {
      const value = input();
      value.currentRevenue = currentRevenue;
      expect(() => assertCalculationInput(value)).toThrow(CalculationInputError);
    },
  );

  it('rejects a duplicate food id and duplicate display order', () => {
    const value = input();
    value.foods = [...value.foods, { ...value.foods[0] }];
    expect(() => assertCalculationInput(value)).toThrow('foods must have unique id values');
  });

  it('rejects conflicting souvenir slots and package sizes other than five', () => {
    const value = input();
    value.souvenirs = [{ ...value.souvenirs[0], packageSize: 4 }];
    expect(() => assertCalculationInput(value)).toThrow('packageSize must equal 5');
  });

  it('rejects a missing candidate when a positive gap remains', () => {
    const value = input();
    value.foods = [];
    value.souvenirs = [];
    expect(() => assertCalculationInput(value)).toThrow('at least one food or souvenir');
  });

  it('uses CalculationInputError when individually safe values overflow an aggregate', () => {
    const firstFoodRevenue = Number.MAX_SAFE_INTEGER;
    const secondFoodRevenue = 1;
    const purchasedPackages = 2;
    const packagePrice = Number.MAX_SAFE_INTEGER;
    expect([firstFoodRevenue, secondFoodRevenue, purchasedPackages, packagePrice].every(Number.isSafeInteger)).toBe(true);
    expect(() => addSafeIntegers(firstFoodRevenue, secondFoodRevenue)).toThrow(CalculationInputError);
    expect(() => multiplySafeIntegers(purchasedPackages, packagePrice)).toThrow(CalculationInputError);
  });
});
