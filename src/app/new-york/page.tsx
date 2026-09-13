import { connection } from 'next/server';
import { calculatePlan } from '@/server/actions/calculate-player-plan';
import { withPlayerStandardDataRepository } from '@/server/repositories/player-standard-data.runtime';
import { CalculatorPageClient } from './calculator-page-client';

export default async function NewYorkPage() {
  await connection();
  const calculatorData = await withPlayerStandardDataRepository((repository) => repository.getCalculatorData('new-york'));
  if (!calculatorData) throw new Error('New York standard data is unavailable.');

  return <main className="min-h-dvh min-w-0 bg-[radial-gradient(circle_at_top,#96C4E466,transparent_45%),linear-gradient(#F5F8FB,#D7E4EE)] px-4 pt-20 text-[#13193D]">
    <header className="mb-5 border-b border-white/70 pb-3"><p className="text-[11px] font-medium tracking-[.18em] text-[#48607A]">CHEFS HELP CHEFS</p><h1 className="mt-1 text-lg font-semibold">纽约 · 计算三星方案</h1></header>
    <CalculatorPageClient calculatorData={calculatorData} calculatePlan={calculatePlan} />
  </main>;
}
