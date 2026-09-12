import { addSafeIntegers, ceilDivide, minSafeInteger, multiplySafeIntegers, subtractSafeIntegers } from './integers';
import type { AllowedSouvenir, SouvenirUse } from './types';

export interface CalculatedSouvenirUse {
  souvenirUse: SouvenirUse;
  addedRevenue: number;
}

export function createSouvenirUse(souvenir: AllowedSouvenir, quantityUsed: number): CalculatedSouvenirUse {
  const inventoryConsumed = minSafeInteger(quantityUsed, souvenir.inventory);
  const quantityBeyondInventory = quantityUsed > souvenir.inventory
    ? subtractSafeIntegers(quantityUsed, souvenir.inventory)
    : 0;
  const packagesPurchased = quantityBeyondInventory === 0
    ? 0
    : ceilDivide(quantityBeyondInventory, souvenir.packageSize);
  const quantityPurchased = multiplySafeIntegers(packagesPurchased, souvenir.packageSize);

  return {
    souvenirUse: {
      slot: souvenir.slot,
      name: souvenir.name,
      quantityUsed,
      inventoryConsumed,
      packagesPurchased,
      quantityPurchased,
      remainingAfterPurchase: subtractSafeIntegers(
        addSafeIntegers(souvenir.inventory, quantityPurchased),
        quantityUsed,
      ),
      diamondCost: multiplySafeIntegers(packagesPurchased, souvenir.diamondPackagePrice),
    },
    addedRevenue: multiplySafeIntegers(quantityUsed, souvenir.perItemRevenue),
  };
}

function maximumUsableQuantity(
  souvenir: AllowedSouvenir,
  diamondBudgetRemaining: number | null,
  remainingGap: number,
): number {
  const requiredForGap = ceilDivide(remainingGap, souvenir.perItemRevenue);
  if (diamondBudgetRemaining === null || souvenir.diamondPackagePrice === 0) return requiredForGap;

  const affordablePackages = Math.floor(diamondBudgetRemaining / souvenir.diamondPackagePrice);
  return minSafeInteger(
    requiredForGap,
    addSafeIntegers(souvenir.inventory, multiplySafeIntegers(affordablePackages, souvenir.packageSize)),
  );
}

export function enumerateSouvenirQuantityPairs(
  remainingGap: number,
  souvenirs: readonly AllowedSouvenir[],
  diamondBudgetRemaining: number | null,
): readonly (readonly number[])[] {
  if (souvenirs.length === 0) return remainingGap === 0 ? [[]] : [];

  const ordered = [...souvenirs].sort((left, right) => left.slot - right.slot);
  if (ordered.length === 1) {
    const maximum = maximumUsableQuantity(ordered[0], diamondBudgetRemaining, remainingGap);
    const minimum = ceilDivide(remainingGap, ordered[0].perItemRevenue);
    return minimum === maximum ? [[minimum]] : [[minimum], [maximum]];
  }

  const [first, second] = ordered;
  const pairs: number[][] = [];
  const seen = new Set<string>();
  const append = (firstQuantity: number, secondQuantity: number): void => {
    const key = `${firstQuantity}:${secondQuantity}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push([firstQuantity, secondQuantity]);
    }
  };

  const firstMaximum = maximumUsableQuantity(first, diamondBudgetRemaining, remainingGap);
  for (let firstQuantity = 0; firstQuantity <= firstMaximum; firstQuantity += 1) {
    const firstUse = createSouvenirUse(first, firstQuantity);
    if (diamondBudgetRemaining !== null && firstUse.souvenirUse.diamondCost > diamondBudgetRemaining) continue;

    const residualGap = firstUse.addedRevenue >= remainingGap
      ? 0
      : subtractSafeIntegers(remainingGap, firstUse.addedRevenue);
    const residualBudget = diamondBudgetRemaining === null
      ? null
      : subtractSafeIntegers(diamondBudgetRemaining, firstUse.souvenirUse.diamondCost);
    const secondMaximum = maximumUsableQuantity(second, residualBudget, residualGap);
    const secondMinimum = residualGap === 0 ? 0 : ceilDivide(residualGap, second.perItemRevenue);
    append(firstQuantity, secondMinimum);
    append(firstQuantity, secondMaximum);
  }

  return pairs;
}
