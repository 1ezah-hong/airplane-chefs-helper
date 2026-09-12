export type CostPreference = 'gold_first' | 'diamond_first';

export interface FoodCandidate {
  id: string;
  name: string;
  categoryName: string;
  displayOrder: number;
  revenueDelta: number;
  goldCost: number;
  diamondCost: number;
}

export interface AllowedSouvenir {
  slot: 1 | 2;
  name: string;
  inventory: number;
  perItemRevenue: number;
  packageSize: 5;
  diamondPackagePrice: number;
}

export interface CalculationInput {
  targetRevenue: number;
  currentRevenue: number;
  goldBudget: number | null;
  diamondBudget: number | null;
  preference: CostPreference;
  foods: readonly FoodCandidate[];
  souvenirs: readonly AllowedSouvenir[];
}

export interface ResourceCostSummary {
  goldCost: number;
  diamondCost: number;
  goldBudgetRemaining: number | null;
  diamondBudgetRemaining: number | null;
}

export interface SouvenirUse {
  slot: 1 | 2;
  name: string;
  quantityUsed: number;
  inventoryConsumed: number;
  packagesPurchased: number;
  quantityPurchased: number;
  remainingAfterPurchase: number;
  diamondCost: number;
}

export interface AlreadyStarredResult {
  status: 'already_starred';
  targetRevenue: number;
  currentRevenue: number;
  gap: 0;
  preference: CostPreference;
}

export interface SuccessCalculationResult extends ResourceCostSummary {
  status: 'success';
  targetRevenue: number;
  currentRevenue: number;
  gap: number;
  preference: CostPreference;
  selectedFoods: readonly FoodCandidate[];
  souvenirUses: readonly SouvenirUse[];
  addedRevenue: number;
  finalRevenue: number;
  revenueOverTarget: number;
}

export interface NoSolutionResult {
  status: 'no_solution';
  targetRevenue: number;
  currentRevenue: number;
  gap: number;
  preference: CostPreference;
  maxAdditionalRevenue: number;
}

export type CalculationResult = AlreadyStarredResult | SuccessCalculationResult | NoSolutionResult;
