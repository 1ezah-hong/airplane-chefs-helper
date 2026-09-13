'use server';

import { withPlayerStandardDataRepository } from '@/server/repositories/player-standard-data.runtime';
import { calculatePlanAtBoundary } from './calculate-player-plan.boundary';

export async function calculatePlan(raw: unknown) {
  return calculatePlanAtBoundary(raw, withPlayerStandardDataRepository);
}
