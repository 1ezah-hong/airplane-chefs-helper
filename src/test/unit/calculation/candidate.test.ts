import { describe, expect, it } from 'vitest';
import {
  compareCandidates,
  makeCandidate,
  prepareCandidateFoods,
  prepareFoodDirectory,
  type PlanCandidate,
} from '@/domain/calculation/candidate';
import { createSouvenirUse } from '@/domain/calculation/souvenir-use';

const food = (id: string, displayOrder: number) => ({
  id,
  name: id,
  categoryName: '主食',
  displayOrder,
  revenueDelta: 100,
  goldCost: 1,
  diamondCost: 1,
});

describe('candidate ranking', () => {
  it('reuses prepared food vector data across souvenir candidates', () => {
    const first = food('first', 1);
    const later = food('later', 2);
    const preparedFoods = prepareCandidateFoods(
      [first],
      prepareFoodDirectory([later, first]),
    );

    const withoutSouvenir = makeCandidate(preparedFoods, 100, 1, 1, []);
    const withSlotTwo = makeCandidate(preparedFoods, 100, 1, 1, [createSouvenirUse({
      slot: 2,
      name: '苹果徽章',
      inventory: 1,
      perItemRevenue: 70,
      packageSize: 5,
      diamondPackagePrice: 1,
    }, 1)]);

    expect(withoutSouvenir.stableDirectoryVector).toEqual([1, 0, 0, 0]);
    expect(withSlotTwo.stableDirectoryVector).toEqual([1, 0, 0, 1]);
  });

  it('uses the stable directory vector when every preceding comparison key ties', () => {
    const left: PlanCandidate = {
      selectedFoods: [food('later', 2)],
      souvenirCalculations: [],
      addedRevenue: 100,
      goldCost: 1,
      diamondCost: 1,
      slotQuantities: [1, 1],
      stableDirectoryVector: [0, 1, 1, 1],
    };
    const right: PlanCandidate = {
      selectedFoods: [food('first', 1)],
      souvenirCalculations: [],
      addedRevenue: 100,
      goldCost: 1,
      diamondCost: 1,
      slotQuantities: [1, 1],
      stableDirectoryVector: [1, 0, 1, 1],
    };

    expect(compareCandidates(left, right, 'gold_first')).toBeLessThan(0);
    expect(compareCandidates(right, left, 'diamond_first')).toBeGreaterThan(0);
  });
});
