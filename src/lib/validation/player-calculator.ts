import { z } from 'zod';
import type { CalculatorData } from '@/server/repositories/player-standard-data.repository';

export interface PlayerCalculationRequest {
  city: 'new-york';
  levelNumber: string;
  currentRevenue: string;
  goldBudget: string;
  diamondBudget: string;
  preference: 'gold_first' | 'diamond_first';
  foods: Record<string, { selected: boolean; revenueDelta: string; goldCost: string; diamondCost: string }>;
  souvenirs: Record<string, { enabled: boolean; inventory: string }>;
}

export interface ParsedPlayerCalculationRequest {
  city: 'new-york';
  levelNumber: number;
  currentRevenue: number;
  goldBudget: number | null;
  diamondBudget: number | null;
  preference: 'gold_first' | 'diamond_first';
  foods: readonly { id: string; revenueDelta: number; goldCost: number; diamondCost: number }[];
  souvenirs: readonly { id: string; inventory: number }[];
}

const decimalDigits = /^\d+$/;
const safeNonNegative = (message: string) => z.string()
  .regex(decimalDigits, message)
  .transform(Number)
  .refine(Number.isSafeInteger, message);
const safePositive = (message: string) => safeNonNegative(message).refine((value) => value > 0, message);

const selectedFood = z.object({
  selected: z.literal(true),
  revenueDelta: safePositive('收入增量必须为正整数'),
  goldCost: safeNonNegative('金币成本必须为允许 0 的非负整数'),
  diamondCost: safeNonNegative('钻石成本必须为允许 0 的非负整数'),
}).strip();
const unselectedFood = z.object({
  selected: z.literal(false),
  revenueDelta: z.string(),
  goldCost: z.string(),
  diamondCost: z.string(),
}).strip();
const enabledSouvenir = z.object({
  enabled: z.literal(true),
  inventory: safeNonNegative('允许使用纪念品时必须填写允许为 0 的非负整数库存'),
}).strip();
const disabledSouvenir = z.object({ enabled: z.literal(false), inventory: z.string() }).strip();

const requestSchema = z.object({
  city: z.literal('new-york'),
  levelNumber: safePositive('关卡必须为正整数'),
  currentRevenue: safeNonNegative('当前总收入必须为允许 0 的非负整数'),
  goldBudget: z.union([z.literal('').transform(() => null), safeNonNegative('金币预算必须为允许 0 的非负整数')]),
  diamondBudget: z.union([z.literal('').transform(() => null), safeNonNegative('钻石预算必须为允许 0 的非负整数')]),
  preference: z.enum(['gold_first', 'diamond_first']),
  foods: z.record(z.string(), z.union([selectedFood, unselectedFood])),
  souvenirs: z.record(z.string(), z.union([enabledSouvenir, disabledSouvenir])),
}).strip();

export function parsePlayerCalculationRequest(raw: unknown): ParsedPlayerCalculationRequest {
  const parsed = requestSchema.parse(raw);
  return {
    city: parsed.city,
    levelNumber: parsed.levelNumber,
    currentRevenue: parsed.currentRevenue,
    goldBudget: parsed.goldBudget,
    diamondBudget: parsed.diamondBudget,
    preference: parsed.preference,
    foods: Object.entries(parsed.foods).flatMap(([id, food]) => food.selected
      ? [{ id, revenueDelta: food.revenueDelta, goldCost: food.goldCost, diamondCost: food.diamondCost }]
      : []),
    souvenirs: Object.entries(parsed.souvenirs).flatMap(([id, souvenir]) => souvenir.enabled
      ? [{ id, inventory: souvenir.inventory }]
      : []),
  };
}

export function createPlayerFormDefaults(data: CalculatorData): PlayerCalculationRequest {
  return {
    city: data.city,
    levelNumber: '1',
    currentRevenue: '0',
    goldBudget: '',
    diamondBudget: '',
    preference: 'gold_first',
    foods: Object.fromEntries(data.foods.map((food) => [food.id, {
      selected: false,
      revenueDelta: '',
      goldCost: '',
      diamondCost: '',
    }])),
    souvenirs: Object.fromEntries(data.souvenirs.map((souvenir) => [souvenir.id, { enabled: false, inventory: '' }])),
  };
}

export function createPlayerFormSchema(data: CalculatorData) {
  return requestSchema.superRefine((request, context) => {
    const level = data.levels.find((candidate) => candidate.number === request.levelNumber);
    const hasCandidate = Object.values(request.foods).some((food) => food.selected)
      || Object.values(request.souvenirs).some((souvenir) => souvenir.enabled);
    if (level && request.currentRevenue < level.targetRevenue && !hasCandidate) {
      context.addIssue({ code: 'custom', message: '当前收入未达标时，至少选择一种食物或纪念品。' });
    }
  });
}

export function toFieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  return issues.reduce<Record<string, readonly string[]>>((fieldErrors, issue) => {
    const key = issue.path.map(String).join('.');
    return { ...fieldErrors, [key]: [...(fieldErrors[key] ?? []), issue.message] };
  }, {});
}
