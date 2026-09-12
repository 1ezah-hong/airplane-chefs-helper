import { addSafeIntegers, subtractSafeIntegers } from './integers';
import type { CalculatedSouvenirUse } from './souvenir-use';
import type { CostPreference, FoodCandidate } from './types';

export interface PlanCandidate {
  selectedFoods: readonly FoodCandidate[];
  souvenirCalculations: readonly CalculatedSouvenirUse[];
  addedRevenue: number;
  goldCost: number;
  diamondCost: number;
  slotQuantities: readonly [number, number];
  stableDirectoryVector: readonly number[];
}

export function makeCandidate(
  selectedFoods: readonly FoodCandidate[],
  foodRevenue: number,
  foodGoldCost: number,
  foodDiamondCost: number,
  souvenirCalculations: readonly CalculatedSouvenirUse[],
  allFoods: readonly FoodCandidate[],
): PlanCandidate {
  const selectedIds = new Set(selectedFoods.map((food) => food.id));
  // Selected = 1 is a fixed internal convention, not a preference for earlier foods.
  const foodVector = [...allFoods]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((food) => selectedIds.has(food.id) ? 1 : 0);
  const quantityForSlot = (slot: 1 | 2): number => souvenirCalculations
    .find((calculation) => calculation.souvenirUse.slot === slot)?.souvenirUse.quantityUsed ?? 0;
  const slotQuantities: [number, number] = [quantityForSlot(1), quantityForSlot(2)];

  return {
    selectedFoods,
    souvenirCalculations,
    addedRevenue: addSafeIntegers(foodRevenue, ...souvenirCalculations.map((calculation) => calculation.addedRevenue)),
    goldCost: foodGoldCost,
    diamondCost: addSafeIntegers(foodDiamondCost, ...souvenirCalculations.map((calculation) => calculation.souvenirUse.diamondCost)),
    slotQuantities,
    stableDirectoryVector: [...foodVector, ...slotQuantities],
  };
}

const compareNumber = (left: number, right: number): number => left === right ? 0 : left < right ? -1 : 1;

export function compareCandidates(left: PlanCandidate, right: PlanCandidate, preference: CostPreference): number {
  const firstCost = preference === 'gold_first' ? 'goldCost' : 'diamondCost';
  const secondCost = preference === 'gold_first' ? 'diamondCost' : 'goldCost';
  const costOrder = compareNumber(left[firstCost], right[firstCost])
    || compareNumber(left[secondCost], right[secondCost]);
  if (costOrder !== 0) return costOrder;

  const foodOrder = compareNumber(left.selectedFoods.length, right.selectedFoods.length);
  if (foodOrder !== 0) return foodOrder;
  const souvenirOrder = compareNumber(addSafeIntegers(...left.slotQuantities), addSafeIntegers(...right.slotQuantities));
  if (souvenirOrder !== 0) return souvenirOrder;

  for (let index = 0; index < left.stableDirectoryVector.length; index += 1) {
    const order = compareNumber(left.stableDirectoryVector[index], right.stableDirectoryVector[index]);
    if (order !== 0) return order;
  }
  return 0;
}

export function isWithinBudget(candidate: PlanCandidate, goldBudget: number | null, diamondBudget: number | null): boolean {
  return (goldBudget === null || candidate.goldCost <= goldBudget)
    && (diamondBudget === null || candidate.diamondCost <= diamondBudget);
}

export function budgetRemaining(cost: number, budget: number | null): number | null {
  return budget === null ? null : subtractSafeIntegers(budget, cost);
}
