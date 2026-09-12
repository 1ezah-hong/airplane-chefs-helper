import { addSafeIntegers, subtractSafeIntegers } from './integers';
import type { FoodCandidate } from './types';

export interface FoodSubset {
  selectedFoods: readonly FoodCandidate[];
  addedRevenue: number;
  goldCost: number;
  diamondCost: number;
}

export function calculateGap(targetRevenue: number, currentRevenue: number): number {
  return currentRevenue >= targetRevenue ? 0 : subtractSafeIntegers(targetRevenue, currentRevenue);
}

export function* enumerateFoodSubsets(foods: readonly FoodCandidate[]): Generator<FoodSubset> {
  const orderedFoods = [...foods].sort((left, right) => left.displayOrder - right.displayOrder);
  for (let mask = 0; mask < 2 ** orderedFoods.length; mask += 1) {
    const selectedFoods = orderedFoods.filter((_, index) => (mask & (1 << index)) !== 0);
    yield {
      selectedFoods,
      addedRevenue: addSafeIntegers(...selectedFoods.map((food) => food.revenueDelta)),
      goldCost: addSafeIntegers(...selectedFoods.map((food) => food.goldCost)),
      diamondCost: addSafeIntegers(...selectedFoods.map((food) => food.diamondCost)),
    };
  }
}
