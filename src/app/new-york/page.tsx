import { connection } from 'next/server';
import { calculatePlan } from '@/server/actions/calculate-player-plan';
import { withPlayerStandardDataRepository } from '@/server/repositories/player-standard-data.runtime';
import { CalculatorPageClient } from './calculator-page-client';
import { NEW_YORK_PAGE_SHELL } from './page-shell';

export default async function NewYorkPage() {
  await connection();
  const calculatorData = await withPlayerStandardDataRepository((repository) => repository.getCalculatorData('new-york'));
  if (!calculatorData) throw new Error('New York standard data is unavailable.');

  return <main className={NEW_YORK_PAGE_SHELL}>
    <header className="mb-5 border-b border-white/70 pb-3"><p className="text-[11px] font-medium tracking-[.18em] text-[#48607A]">CHEFS HELP CHEFS</p><h1 className="mt-1 text-lg font-semibold">纽约 · 计算三星方案</h1></header>
    <CalculatorPageClient calculatorData={calculatorData} calculatePlan={calculatePlan} />
  </main>;
}
