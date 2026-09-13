'use client';

import { useRouter } from 'next/navigation';
import type { PlayerCalculationActionState } from '@/server/actions/calculate-player-plan.boundary';
import type { PlayerCalculationRequest } from '@/lib/validation/player-calculator';
import type { CalculatorData } from '@/server/repositories/player-standard-data.repository';
import { savePlayerResultSnapshot } from './browser-storage';
import { CalculatorForm } from './calculator-form';

type Props = {
  calculatorData: CalculatorData;
  calculatePlan: (raw: PlayerCalculationRequest) => Promise<PlayerCalculationActionState>;
};

export function CalculatorPageClient({ calculatorData, calculatePlan }: Props) {
  const router = useRouter();

  function showResult(result: Extract<PlayerCalculationActionState, { ok: true }>, levelNumber: string) {
    savePlayerResultSnapshot(result.data, Number(levelNumber));
    router.push('/new-york/result');
  }

  return <CalculatorForm calculatorData={calculatorData} calculatePlan={calculatePlan} onResult={showResult} />;
}
