import type { AllowedSouvenir, CalculationInput, FoodCandidate } from './types';
import { assertSafeInteger, CalculationInputError } from './integers';

export { CalculationInputError } from './integers';

const fail = (message: string): never => { throw new CalculationInputError(message); };
const requiredText = (value: string, label: string): void => { if (value.trim().length === 0) fail(`${label} must be non-empty`); };
const nonNegative = (value: number, label: string): void => { try { assertSafeInteger(value, label); } catch { fail(`${label} must be a non-negative safe integer`); } };
const positive = (value: number, label: string): void => { try { assertSafeInteger(value, label, 1); } catch { fail(`${label} must be a positive safe integer`); } };

function validateFood(food: FoodCandidate): void {
  requiredText(food.id, 'food id'); requiredText(food.name, 'food name'); requiredText(food.categoryName, 'food categoryName');
  positive(food.displayOrder, 'food displayOrder'); positive(food.revenueDelta, 'food revenueDelta');
  nonNegative(food.goldCost, 'food goldCost'); nonNegative(food.diamondCost, 'food diamondCost');
}

function validateSouvenir(souvenir: AllowedSouvenir): void {
  if (souvenir.slot !== 1 && souvenir.slot !== 2) fail('souvenir slot must be 1 or 2');
  requiredText(souvenir.name, 'souvenir name'); nonNegative(souvenir.inventory, 'souvenir inventory');
  positive(souvenir.perItemRevenue, 'souvenir perItemRevenue');
  if (souvenir.packageSize !== 5) fail('souvenir packageSize must equal 5');
  nonNegative(souvenir.diamondPackagePrice, 'souvenir diamondPackagePrice');
}

export function assertCalculationInput(input: CalculationInput): void {
  positive(input.targetRevenue, 'targetRevenue'); nonNegative(input.currentRevenue, 'currentRevenue');
  if (input.goldBudget !== null) nonNegative(input.goldBudget, 'goldBudget');
  if (input.diamondBudget !== null) nonNegative(input.diamondBudget, 'diamondBudget');
  if (input.preference !== 'gold_first' && input.preference !== 'diamond_first') fail('preference must be gold_first or diamond_first');
  if (input.foods.length > 20) fail('foods must contain at most 20 entries');
  if (input.souvenirs.length > 2) fail('souvenirs must contain at most 2 entries');
  input.foods.forEach(validateFood); input.souvenirs.forEach(validateSouvenir);
  if (new Set(input.foods.map((food) => food.id)).size !== input.foods.length) fail('foods must have unique id values');
  if (new Set(input.foods.map((food) => food.displayOrder)).size !== input.foods.length) fail('foods must have unique displayOrder values');
  if (new Set(input.souvenirs.map((souvenir) => souvenir.slot)).size !== input.souvenirs.length) fail('souvenirs must have unique slot values');
  if (input.currentRevenue < input.targetRevenue && input.foods.length === 0 && input.souvenirs.length === 0) fail('at least one food or souvenir is required when a positive gap remains');
}
