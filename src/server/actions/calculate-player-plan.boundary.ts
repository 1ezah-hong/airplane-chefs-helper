import 'server-only';

import { z } from 'zod';
import type { CalculationResult } from '@/domain/calculation';
import { CalculationInputError } from '@/domain/calculation/validation';
import { parsePlayerCalculationRequest, toFieldErrors } from '@/lib/validation/player-calculator';
import {
  PlayerStandardDataNotFoundError,
  type PlayerStandardDataRepository,
} from '@/server/repositories/player-standard-data.repository';
import { calculatePlayerPlan, PlayerCalculationValidationError } from '@/server/services/calculate-player-plan';

export type PlayerCalculationActionState =
  | { ok: true; data: CalculationResult }
  | { ok: false; error: { code: 'ValidationError'; message: string; fieldErrors?: Record<string, readonly string[]> } }
  | { ok: false; error: { code: 'NotFound' | 'InternalError'; message: string } };

export type PlayerRepositoryRunner = <T>(
  work: (repository: PlayerStandardDataRepository) => Promise<T>,
) => Promise<T>;

export async function calculatePlanAtBoundary(
  raw: unknown,
  runWithRepository: PlayerRepositoryRunner,
): Promise<PlayerCalculationActionState> {
  try {
    const parsed = parsePlayerCalculationRequest(raw);
    return { ok: true, data: await runWithRepository((repository) => calculatePlayerPlan(parsed, repository)) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: { code: 'ValidationError', message: '请检查输入。', fieldErrors: toFieldErrors(error.issues) } };
    }
    if (error instanceof PlayerCalculationValidationError) {
      return { ok: false, error: { code: 'ValidationError', message: error.message } };
    }
    if (error instanceof CalculationInputError) {
      return { ok: false, error: { code: 'ValidationError', message: '数值过大，请缩小收入、成本或库存后重试' } };
    }
    if (error instanceof PlayerStandardDataNotFoundError) {
      return { ok: false, error: { code: 'NotFound', message: '标准数据已更新，请刷新后重试' } };
    }
    return { ok: false, error: { code: 'InternalError', message: '暂时无法计算，请重试。' } };
  }
}
