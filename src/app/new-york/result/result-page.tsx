'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CalculationResult } from '@/domain/calculation';
import { readPlayerResultSnapshot, type PlayerResultSnapshot } from '../browser-storage';
import { NEW_YORK_PAGE_SHELL } from '../page-shell';

const card = 'rounded-[26px] border border-white/80 bg-white/40 p-4 shadow-[0_8px_30px_rgba(19,25,61,.1)] backdrop-blur-xl';
const metric = 'rounded-xl bg-white/60 p-3';

function NumberMetric({ label, value }: { label: string; value: number }) {
  return <div className={metric}><dt className="text-xs text-[#48607A]">{label}</dt><dd className="mt-1 text-lg font-semibold text-[#13193D]">{value}</dd></div>;
}

function ReturnLink({ label = '返回并修改输入' }: { label?: string }) {
  return <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/70 bg-[#F5F8FB]/85 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"><Link className="block w-full rounded-[18px] bg-[#13193D] px-4 py-4 text-center text-base font-semibold text-[#F8F2EA] shadow-[0_8px_24px_rgba(19,25,61,.28)]" href="/new-york">{label}</Link></div>;
}

function ResultHeader({ levelNumber, title, summary }: { levelNumber: number; title: string; summary: string }) {
  return <header className="mb-4"><p className="text-[11px] font-medium tracking-[.18em] text-[#48607A]">纽约 · 第 {levelNumber} 关</p><h1 className="mt-1 text-2xl font-semibold text-[#13193D]">{title}</h1><p className="mt-2 text-sm text-[#48607A]">{summary}</p></header>;
}

function BaseMetrics({ result }: { result: CalculationResult }) {
  return <section className={card}><h2 className="mb-3 text-base font-semibold text-[#13193D]">收入情况</h2><dl className="grid grid-cols-2 gap-2"><NumberMetric label="三星目标" value={result.targetRevenue} /><NumberMetric label="当前收入" value={result.currentRevenue} /><NumberMetric label="收入缺口" value={result.gap} /></dl></section>;
}

function SuccessResult({ result, levelNumber }: { result: Extract<CalculationResult, { status: 'success' }>; levelNumber: number }) {
  return <><ResultHeader levelNumber={levelNumber} title="已找到三星方案" summary="以下是本次计算返回的最优升级组合。" /><BaseMetrics result={result} />
    <section className={card}><h2 className="mb-3 text-base font-semibold text-[#13193D]">完成后收入</h2><dl className="grid grid-cols-3 gap-2"><NumberMetric label="增加收入" value={result.addedRevenue} /><NumberMetric label="最终收入" value={result.finalRevenue} /><NumberMetric label="超出目标" value={result.revenueOverTarget} /></dl></section>
    <section className={card}><h2 className="mb-3 text-base font-semibold text-[#13193D]">升级食物</h2>{result.selectedFoods.length === 0 ? <p className="text-sm text-[#48607A]">未使用食物升级。</p> : <ul className="space-y-2">{result.selectedFoods.map((food) => <li className="rounded-xl bg-white/60 p-3 text-sm text-[#41566D]" key={food.id}><div className="flex justify-between gap-3"><strong className="text-[#13193D]">{food.name}</strong><span>{food.categoryName}</span></div><p className="mt-1">收入 +{food.revenueDelta} · 金币 {food.goldCost} · 钻石 {food.diamondCost}</p></li>)}</ul>}</section>
    <section className={card}><h2 className="mb-3 text-base font-semibold text-[#13193D]">纪念品使用</h2>{result.souvenirUses.length === 0 ? <p className="text-sm text-[#48607A]">未使用纪念品。</p> : <ul className="space-y-2">{result.souvenirUses.map((souvenir) => <li className="rounded-xl bg-white/60 p-3 text-sm text-[#41566D]" key={souvenir.slot}><strong className="text-[#13193D]">{souvenir.name}</strong><p className="mt-1">使用 {souvenir.quantityUsed} 件 · 消耗库存 {souvenir.inventoryConsumed} · 购买 {souvenir.packagesPurchased} 包（{souvenir.quantityPurchased} 件）</p><p>购买后剩余 {souvenir.remainingAfterPurchase} 件 · 钻石 {souvenir.diamondCost}</p></li>)}</ul>}</section>
    <section className={card}><h2 className="mb-3 text-base font-semibold text-[#13193D]">成本与预算</h2><dl className="grid grid-cols-2 gap-2"><NumberMetric label="金币总计" value={result.goldCost} /><NumberMetric label="钻石总计" value={result.diamondCost} />{result.goldBudgetRemaining !== null && <NumberMetric label="金币剩余" value={result.goldBudgetRemaining} />}{result.diamondBudgetRemaining !== null && <NumberMetric label="钻石剩余" value={result.diamondBudgetRemaining} />}</dl></section>
    <ReturnLink /></>;
}

function AlreadyStarredResult({ result, levelNumber }: { result: Extract<CalculationResult, { status: 'already_starred' }>; levelNumber: number }) {
  return <><ResultHeader levelNumber={levelNumber} title="当前已达三星" summary="当前收入已经达到三星目标，无需继续安排升级。" /><section className={card}><h2 className="mb-3 text-base font-semibold text-[#13193D]">收入情况</h2><dl className="grid grid-cols-2 gap-2"><NumberMetric label="三星目标" value={result.targetRevenue} /><NumberMetric label="当前收入" value={result.currentRevenue} /></dl></section><ReturnLink /></>;
}

function NoSolutionResult({ result, levelNumber }: { result: Extract<CalculationResult, { status: 'no_solution' }>; levelNumber: number }) {
  return <><ResultHeader levelNumber={levelNumber} title="暂无可行方案" summary="在本次选择和预算下，无法达到三星目标。" /><BaseMetrics result={result} /><section className={card}><h2 className="mb-3 text-base font-semibold text-[#13193D]">本次可达上限</h2><dl><NumberMetric label="最大可增加收入" value={result.maxAdditionalRevenue} /></dl></section><ReturnLink /></>;
}

function ResultContent({ snapshot }: { snapshot: PlayerResultSnapshot }) {
  switch (snapshot.result.status) {
    case 'success': return <SuccessResult levelNumber={snapshot.levelNumber} result={snapshot.result} />;
    case 'already_starred': return <AlreadyStarredResult levelNumber={snapshot.levelNumber} result={snapshot.result} />;
    case 'no_solution': return <NoSolutionResult levelNumber={snapshot.levelNumber} result={snapshot.result} />;
  }
}

export function ResultPage() {
  const [snapshot, setSnapshot] = useState<PlayerResultSnapshot | null>(null);
  useEffect(() => {
    const readSnapshot = window.setTimeout(() => setSnapshot(readPlayerResultSnapshot()));
    return () => window.clearTimeout(readSnapshot);
  }, []);

  return <main className={`${NEW_YORK_PAGE_SHELL} pb-[max(7rem,calc(env(safe-area-inset-bottom)+6rem))] md:pb-8`}>
    <div className="mx-auto min-w-0 space-y-4">{snapshot ? <ResultContent snapshot={snapshot} /> : <section className={card}><h1 className="text-xl font-semibold text-[#13193D]">暂无可显示的计算结果。</h1><p className="mt-2 text-sm text-[#48607A]">请返回计算器填写数据后重新计算。</p><div className="mt-4"><ReturnLink label="返回计算器" /></div></section>}</div>
  </main>;
}
