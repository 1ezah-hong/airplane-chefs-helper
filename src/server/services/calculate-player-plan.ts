import { calculateOptimalPlan, type CalculationInput, type CalculationResult } from '@/domain/calculation';
import type { ParsedPlayerCalculationRequest } from '@/lib/validation/player-calculator';
import type { PlayerStandardDataRepository } from '@/server/repositories/player-standard-data.repository';

export class PlayerCalculationValidationError extends Error {
  override name = 'PlayerCalculationValidationError';
}

export async function calculatePlayerPlan(
  parsed: ParsedPlayerCalculationRequest,
  authorityReader: PlayerStandardDataRepository,
): Promise<CalculationResult> {
  const authority = await authorityReader.getCalculationAuthority({
    city: parsed.city,
    levelNumber: parsed.levelNumber,
    foodIds: parsed.foods.map((food) => food.id),
    souvenirIds: parsed.souvenirs.map((souvenir) => souvenir.id),
  });
  const foodValues = new Map(parsed.foods.map((food) => [food.id, food]));
  const souvenirValues = new Map(parsed.souvenirs.map((souvenir) => [souvenir.id, souvenir]));
  const input: CalculationInput = {
    targetRevenue: authority.level.targetRevenue,
    currentRevenue: parsed.currentRevenue,
    goldBudget: parsed.goldBudget,
    diamondBudget: parsed.diamondBudget,
    preference: parsed.preference,
    foods: authority.foods.map((food) => ({ ...food, ...foodValues.get(food.id)! })),
    souvenirs: authority.souvenirs.map((souvenir) => ({
      slot: souvenir.slot,
      name: souvenir.name,
      inventory: souvenirValues.get(souvenir.id)!.inventory,
      perItemRevenue: souvenir.perItemRevenue,
      packageSize: souvenir.packageSize,
      diamondPackagePrice: souvenir.diamondPackagePrice,
    })),
  };
  if (input.currentRevenue < input.targetRevenue && input.foods.length === 0 && input.souvenirs.length === 0) {
    throw new PlayerCalculationValidationError('当前收入未达标时，至少选择一种食物或纪念品。');
  }
  return calculateOptimalPlan(input);
}
