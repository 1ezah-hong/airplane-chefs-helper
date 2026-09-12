import { describe, expect, it } from 'vitest';
import { createSouvenirUse, enumerateSouvenirQuantityPairs } from '@/domain/calculation/souvenir-use';
import { CalculationInputError } from '@/domain/calculation/integers';

const hat = {
  slot: 1 as const,
  name: '自由帽',
  inventory: 3,
  perItemRevenue: 60,
  packageSize: 5 as const,
  diamondPackagePrice: 2,
};

const apron = {
  slot: 2 as const,
  name: '围裙',
  inventory: 1,
  perItemRevenue: 100,
  packageSize: 5 as const,
  diamondPackagePrice: 3,
};

describe('souvenir calculations', () => {
  it('uses inventory before buying one complete five-item package', () => {
    expect(createSouvenirUse(hat, 6)).toEqual({
      souvenirUse: {
        slot: 1,
        name: '自由帽',
        quantityUsed: 6,
        inventoryConsumed: 3,
        packagesPurchased: 1,
        quantityPurchased: 5,
        remainingAfterPurchase: 2,
        diamondCost: 2,
      },
      addedRevenue: 360,
    });
  });

  it('does not buy a package when inventory covers the used quantity', () => {
    expect(createSouvenirUse(hat, 2)).toMatchObject({
      souvenirUse: {
        inventoryConsumed: 2,
        packagesPurchased: 0,
        quantityPurchased: 0,
        remainingAfterPurchase: 1,
        diamondCost: 0,
      },
    });
  });

  it('includes the greatest budget-feasible partial quantity for no-solution maximum revenue', () => {
    expect(enumerateSouvenirQuantityPairs(500, [hat], 2)).toContainEqual([8]);
  });

  it('rejects a negative quantity used', () => {
    expect(() => createSouvenirUse(hat, -1)).toThrow(CalculationInputError);
  });

  it('rejects a negative remaining gap', () => {
    expect(() => enumerateSouvenirQuantityPairs(-1, [], null)).toThrow(CalculationInputError);
  });

  it('rejects a negative diamond budget', () => {
    expect(() => enumerateSouvenirQuantityPairs(500, [hat], -1)).toThrow(CalculationInputError);
  });

  it('rejects a NaN quantity used', () => {
    expect(() => createSouvenirUse(hat, Number.NaN)).toThrow(CalculationInputError);
  });

  it('rejects a fractional remaining gap', () => {
    expect(() => enumerateSouvenirQuantityPairs(500.5, [hat], null)).toThrow(CalculationInputError);
  });

  it('rejects an unsafe diamond budget', () => {
    expect(() => enumerateSouvenirQuantityPairs(500, [hat], Number.MAX_SAFE_INTEGER + 1)).toThrow(CalculationInputError);
  });

  it('rejects a third souvenir instead of dropping it from the pair enumeration', () => {
    expect(() => enumerateSouvenirQuantityPairs(500, [hat, apron, hat], null)).toThrow(CalculationInputError);
  });

  it('keeps two-slot quantity candidates ordered by slot with finite bounds', () => {
    expect(enumerateSouvenirQuantityPairs(120, [apron, hat], null)).toEqual([
      [0, 2],
      [1, 1],
      [2, 0],
    ]);
  });

  it('keeps a finite success-bound quantity for a positive-price souvenir with unlimited diamonds', () => {
    expect(enumerateSouvenirQuantityPairs(500, [hat], null)).toEqual([[9]]);
  });

  it('keeps a finite success-bound quantity for a zero-price souvenir with a finite diamond budget', () => {
    expect(enumerateSouvenirQuantityPairs(250, [{ ...apron, diamondPackagePrice: 0 }], 0)).toEqual([[3]]);
  });
});
