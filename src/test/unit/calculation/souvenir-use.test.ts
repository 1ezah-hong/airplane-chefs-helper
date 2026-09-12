import { describe, expect, it } from 'vitest';
import { createSouvenirUse, enumerateSouvenirQuantityPairs } from '@/domain/calculation/souvenir-use';

const hat = {
  slot: 1 as const,
  name: '自由帽',
  inventory: 3,
  perItemRevenue: 60,
  packageSize: 5 as const,
  diamondPackagePrice: 2,
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
});
