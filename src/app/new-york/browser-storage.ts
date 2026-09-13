import type { CalculationResult } from '@/domain/calculation';
import type { PlayerCalculationRequest } from '@/lib/validation/player-calculator';

export const playerDraftStorageKey = 'airplane-chefs:new-york:draft';
export const playerResultStorageKey = 'airplane-chefs:new-york:result';

export type PlayerResultSnapshot = {
  levelNumber: number;
  result: CalculationResult;
};

type PlainRecord = Record<string, unknown>;

function isRecord(value: unknown): value is PlainRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseStorage(storage: Storage, key: string): unknown {
  try {
    const value = storage.getItem(key);
    return value === null ? null : JSON.parse(value);
  } catch {
    return null;
  }
}

function validFood(value: unknown): value is PlayerCalculationRequest['foods'][string] {
  return isRecord(value)
    && typeof value.selected === 'boolean'
    && isString(value.revenueDelta)
    && isString(value.goldCost)
    && isString(value.diamondCost);
}

function validSouvenir(value: unknown): value is PlayerCalculationRequest['souvenirs'][string] {
  return isRecord(value) && typeof value.enabled === 'boolean' && isString(value.inventory);
}

export function readPlayerDraft(fallback: PlayerCalculationRequest): PlayerCalculationRequest {
  if (typeof window === 'undefined') return fallback;
  const raw = parseStorage(window.localStorage, playerDraftStorageKey);
  const foods = isRecord(raw) ? raw.foods : null;
  const souvenirs = isRecord(raw) ? raw.souvenirs : null;
  if (!isRecord(raw)
    || raw.city !== fallback.city
    || !isString(raw.levelNumber)
    || !isString(raw.currentRevenue)
    || !isString(raw.goldBudget)
    || !isString(raw.diamondBudget)
    || (raw.preference !== 'gold_first' && raw.preference !== 'diamond_first')
    || !isRecord(foods)
    || !isRecord(souvenirs)) return fallback;

  return {
    city: fallback.city,
    levelNumber: raw.levelNumber,
    currentRevenue: raw.currentRevenue,
    goldBudget: raw.goldBudget,
    diamondBudget: raw.diamondBudget,
    preference: raw.preference,
    foods: Object.fromEntries(Object.entries(fallback.foods).map(([id, value]) => [id, validFood(foods[id]) ? foods[id] : value])),
    souvenirs: Object.fromEntries(Object.entries(fallback.souvenirs).map(([id, value]) => [id, validSouvenir(souvenirs[id]) ? souvenirs[id] : value])),
  };
}

export function savePlayerDraft(request: PlayerCalculationRequest) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(playerDraftStorageKey, JSON.stringify(request));
  } catch {
    // Storage may be unavailable or full; the calculator remains usable.
  }
}

function hasNumbers(value: PlainRecord, keys: readonly string[]) {
  return keys.every((key) => isFiniteNumber(value[key]));
}

function validResult(value: unknown): value is CalculationResult {
  if (!isRecord(value)
    || (value.preference !== 'gold_first' && value.preference !== 'diamond_first')
    || !hasNumbers(value, ['targetRevenue', 'currentRevenue', 'gap'])) return false;

  if (value.status === 'already_starred') return value.gap === 0;
  if (value.status === 'no_solution') return hasNumbers(value, ['maxAdditionalRevenue']);
  if (value.status !== 'success'
    || !hasNumbers(value, ['addedRevenue', 'finalRevenue', 'revenueOverTarget', 'goldCost', 'diamondCost'])
    || !Array.isArray(value.selectedFoods)
    || !Array.isArray(value.souvenirUses)
    || !(value.goldBudgetRemaining === null || isFiniteNumber(value.goldBudgetRemaining))
    || !(value.diamondBudgetRemaining === null || isFiniteNumber(value.diamondBudgetRemaining))) return false;

  return value.selectedFoods.every((food) => isRecord(food)
    && isString(food.id) && isString(food.name) && isString(food.categoryName)
    && hasNumbers(food, ['displayOrder', 'revenueDelta', 'goldCost', 'diamondCost']))
    && value.souvenirUses.every((souvenir) => isRecord(souvenir)
      && isString(souvenir.name)
      && (souvenir.slot === 1 || souvenir.slot === 2)
      && hasNumbers(souvenir, ['quantityUsed', 'inventoryConsumed', 'packagesPurchased', 'quantityPurchased', 'remainingAfterPurchase', 'diamondCost']));
}

export function readPlayerResultSnapshot(): PlayerResultSnapshot | null {
  if (typeof window === 'undefined') return null;
  const raw = parseStorage(window.sessionStorage, playerResultStorageKey);
  const levelNumber = isRecord(raw) ? raw.levelNumber : null;
  const result = isRecord(raw) ? raw.result : null;
  if (!isFiniteNumber(levelNumber) || !Number.isSafeInteger(levelNumber) || levelNumber <= 0 || !validResult(result)) return null;
  return { levelNumber, result };
}

export function savePlayerResultSnapshot(result: CalculationResult, levelNumber: number) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(playerResultStorageKey, JSON.stringify({ levelNumber, result }));
  } catch {
    // A failed snapshot write must not prevent the user from seeing the result route.
  }
}
