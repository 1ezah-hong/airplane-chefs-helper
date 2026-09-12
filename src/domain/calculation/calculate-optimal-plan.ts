import {
  budgetRemaining,
  compareCandidates,
  isWithinBudget,
  makeCandidate,
  prepareCandidateFoods,
  prepareFoodDirectory,
  type PlanCandidate,
} from './candidate';
import { calculateGap, enumerateFoodSubsets } from './food-subsets';
import { addSafeIntegers, subtractSafeIntegers } from './integers';
import { createSouvenirUse, enumerateSouvenirQuantityPairs } from './souvenir-use';
import type { CalculationInput, CalculationResult } from './types';
import { assertCalculationInput } from './validation';

export function calculateOptimalPlan(input: CalculationInput): CalculationResult {
  assertCalculationInput(input);
  const gap = calculateGap(input.targetRevenue, input.currentRevenue);
  const summary = {
    targetRevenue: input.targetRevenue,
    currentRevenue: input.currentRevenue,
    gap,
    preference: input.preference,
  };
  if (gap === 0) return { ...summary, status: 'already_starred', gap: 0 };

  const orderedSouvenirs = [...input.souvenirs].sort((left, right) => left.slot - right.slot);
  const foodDirectory = prepareFoodDirectory(input.foods);
  let bestSuccessfulCandidate: PlanCandidate | undefined;
  let maxAdditionalRevenue = 0;
  for (const foodSubset of enumerateFoodSubsets(input.foods)) {
    if (input.goldBudget !== null && foodSubset.goldCost > input.goldBudget) continue;
    if (input.diamondBudget !== null && foodSubset.diamondCost > input.diamondBudget) continue;

    const remainingGap = foodSubset.addedRevenue >= gap ? 0 : subtractSafeIntegers(gap, foodSubset.addedRevenue);
    const remainingDiamondBudget = budgetRemaining(foodSubset.diamondCost, input.diamondBudget);
    const preparedFoods = prepareCandidateFoods(foodSubset.selectedFoods, foodDirectory);
    // A feasible food-only subset still contributes to the no-solution maximum.
    const quantityPairs = orderedSouvenirs.length === 0
      ? [[]]
      : enumerateSouvenirQuantityPairs(remainingGap, orderedSouvenirs, remainingDiamondBudget);
    for (const quantities of quantityPairs) {
      const souvenirCalculations = orderedSouvenirs.map((souvenir, index) => createSouvenirUse(souvenir, quantities[index]));
      const candidate = makeCandidate(
        preparedFoods, foodSubset.addedRevenue, foodSubset.goldCost,
        foodSubset.diamondCost, souvenirCalculations,
      );
      if (!isWithinBudget(candidate, input.goldBudget, input.diamondBudget)) continue;
      maxAdditionalRevenue = Math.max(maxAdditionalRevenue, candidate.addedRevenue);
      if (candidate.addedRevenue >= gap
        && (!bestSuccessfulCandidate || compareCandidates(candidate, bestSuccessfulCandidate, input.preference) < 0)) {
        bestSuccessfulCandidate = candidate;
      }
    }
  }

  if (!bestSuccessfulCandidate) return { ...summary, status: 'no_solution', maxAdditionalRevenue };

  const winner = bestSuccessfulCandidate;
  const finalRevenue = addSafeIntegers(input.currentRevenue, winner.addedRevenue);
  return {
    ...summary,
    status: 'success',
    selectedFoods: winner.selectedFoods,
    souvenirUses: winner.souvenirCalculations.map((calculation) => calculation.souvenirUse).filter((use) => use.quantityUsed > 0),
    addedRevenue: winner.addedRevenue,
    finalRevenue,
    revenueOverTarget: subtractSafeIntegers(finalRevenue, input.targetRevenue),
    goldCost: winner.goldCost,
    diamondCost: winner.diamondCost,
    goldBudgetRemaining: budgetRemaining(winner.goldCost, input.goldBudget),
    diamondBudgetRemaining: budgetRemaining(winner.diamondCost, input.diamondBudget),
  };
}
