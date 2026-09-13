'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { PlayerCalculationActionState } from '@/server/actions/calculate-player-plan.boundary';
import type { PlayerCalculationRequest } from '@/lib/validation/player-calculator';
import type { CalculatorData } from '@/server/repositories/player-standard-data.repository';
import { readPlayerDraft, savePlayerDraft } from './browser-storage';

type Props = {
  calculatorData: CalculatorData;
  calculatePlan: (raw: PlayerCalculationRequest) => Promise<PlayerCalculationActionState>;
  onResult?: (result: Extract<PlayerCalculationActionState, { ok: true }>, levelNumber: string) => void;
};

const field = 'w-full min-w-0 rounded-xl border border-[#D6E2ED] bg-white/90 px-3.5 py-3 text-[#13193D] outline-none focus-visible:ring-2 focus-visible:ring-[#2E6FA8]';

function defaults(data: CalculatorData): PlayerCalculationRequest {
  return {
    city: data.city, levelNumber: String(data.levels[0]?.number ?? 1), currentRevenue: '0', goldBudget: '', diamondBudget: '', preference: 'gold_first',
    foods: Object.fromEntries(data.foods.map((food) => [food.id, { selected: false, revenueDelta: '', goldCost: '', diamondCost: '' }])),
    souvenirs: Object.fromEntries(data.souvenirs.map((souvenir) => [souvenir.id, { enabled: false, inventory: '' }])),
  };
}

function ErrorText({ messages }: { messages?: readonly string[] }) {
  return messages?.[0] ? <p className="mt-1 text-sm text-[#B5452F]">{messages[0]}</p> : null;
}

function NumberField({ id, label, value, onChange, error }: { id: string; label: string; value: string; onChange: (value: string) => void; error?: readonly string[] }) {
  return <div><label className="block text-sm font-medium text-[#48607A]" htmlFor={id}>{label}
    <input id={id} className={`${field} mt-1.5`} type="number" inputMode="numeric" min="0" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  </label><ErrorText messages={error} /></div>;
}

export function CalculatorForm({ calculatorData, calculatePlan, onResult }: Props) {
  const [request, setRequest] = useState(() => defaults(calculatorData));
  const [draftReady, setDraftReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [errors, setErrors] = useState<Record<string, readonly string[]>>({});
  const level = calculatorData.levels.find((candidate) => candidate.number === Number(request.levelNumber));

  useEffect(() => {
    const restoreDraft = window.setTimeout(() => {
      setRequest((current) => readPlayerDraft(current));
      setDraftReady(true);
    });
    return () => window.clearTimeout(restoreDraft);
  }, []);

  useEffect(() => {
    if (draftReady) savePlayerDraft(request);
  }, [draftReady, request]);

  const setRoot = (key: 'levelNumber' | 'currentRevenue' | 'goldBudget' | 'diamondBudget', value: string) => setRequest((current) => ({ ...current, [key]: value }));
  const updateFood = (id: string, patch: Partial<PlayerCalculationRequest['foods'][string]>) => setRequest((current) => ({ ...current, foods: { ...current.foods, [id]: { ...current.foods[id], ...patch } } }));
  const updateSouvenir = (id: string, patch: Partial<PlayerCalculationRequest['souvenirs'][string]>) => setRequest((current) => ({ ...current, souvenirs: { ...current.souvenirs, [id]: { ...current.souvenirs[id], ...patch } } }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setMessage(undefined); setErrors({});
    try {
      const result = await calculatePlan(request);
      if (result.ok) onResult?.(result, request.levelNumber);
      else {
        setMessage(result.error.message);
        setErrors(result.error.code === 'ValidationError' ? result.error.fieldErrors ?? {} : {});
      }
    } catch { setMessage('暂时无法计算，请重试。'); }
    finally { setPending(false); }
  }

  return <form className="min-w-0 space-y-4 pb-[max(5rem,calc(env(safe-area-inset-bottom)+1.25rem))]" onSubmit={submit} noValidate>
    <section className="rounded-[26px] border border-white/80 bg-white/40 p-4 shadow-[0_8px_30px_rgba(19,25,61,.1)] backdrop-blur-xl">
      <h2 className="mb-4 text-base font-semibold text-[#13193D]">① 当前状态</h2>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[#48607A]" htmlFor="level-number">关卡
          <select id="level-number" className={`${field} mt-1.5`} value={request.levelNumber} onChange={(event) => setRoot('levelNumber', event.currentTarget.value)}>{calculatorData.levels.map((item) => <option key={item.number} value={item.number}>第 {item.number} 关</option>)}</select>
        </label>
        <div className="flex items-center justify-between rounded-xl bg-white/55 px-3.5 py-3" aria-label="三星目标"><span className="text-sm font-medium text-[#48607A]">★★★ 三星目标</span><strong className="text-xl text-[#13193D]">{level?.targetRevenue ?? '—'}</strong></div>
        <NumberField id="current-revenue" label="当前总收入" value={request.currentRevenue} onChange={(value) => setRoot('currentRevenue', value)} error={errors.currentRevenue} />
      </div>
    </section>

    <section className="rounded-[26px] border border-white/80 bg-white/40 p-4 shadow-[0_8px_30px_rgba(19,25,61,.1)] backdrop-blur-xl">
      <h2 className="mb-4 text-base font-semibold text-[#13193D]">② 预算与偏好</h2>
      <div className="space-y-3">
        <NumberField id="gold-budget" label="金币预算（可留空）" value={request.goldBudget} onChange={(value) => setRoot('goldBudget', value)} error={errors.goldBudget} />
        <NumberField id="diamond-budget" label="钻石预算（可留空）" value={request.diamondBudget} onChange={(value) => setRoot('diamondBudget', value)} error={errors.diamondBudget} />
        <fieldset aria-required="true"><legend className="mb-1.5 text-sm font-medium text-[#48607A]">成本偏好</legend><div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#E6EEF6]/80 p-1">
          {([['gold_first', '优先省金币'], ['diamond_first', '优先省钻石']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={request.preference === value} onClick={() => setRequest((current) => ({ ...current, preference: value }))} className={`rounded-xl px-3 py-2.5 text-sm font-medium ${request.preference === value ? 'bg-white text-[#1E5A8A] shadow-sm' : 'text-[#5B7089]'}`}>{label}</button>)}
        </div></fieldset>
        <ErrorText messages={errors.preference} />
      </div>
    </section>

    <section className="rounded-[26px] border border-white/80 bg-white/40 p-4 shadow-[0_8px_30px_rgba(19,25,61,.1)] backdrop-blur-xl">
      <h2 className="mb-4 text-base font-semibold text-[#13193D]">③ 食物升级候选</h2><div className="space-y-3">
        {calculatorData.foods.map((food) => { const value = request.foods[food.id]; if (!value) return null; return <div key={food.id} className="rounded-2xl border border-[#E1EAF2] bg-white/40 p-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#41566D]" htmlFor={`food-${food.id}`}><input id={`food-${food.id}`} type="checkbox" aria-label={`选择${food.name}`} checked={value.selected} onChange={(event) => updateFood(food.id, { selected: event.currentTarget.checked })} /><span className="min-w-0 flex-1">{food.name}</span><span className="rounded-full bg-[#E7EFF6] px-2 py-1 text-xs text-[#48607A]">{food.categoryName}</span></label>
          {value.selected && <div className="mt-3 space-y-3 border-t border-[#E1EAF2] pt-3">
            <NumberField id={`${food.id}-revenueDelta`} label={`${food.name}收入增量`} value={value.revenueDelta} onChange={(revenueDelta) => updateFood(food.id, { revenueDelta })} error={errors[`foods.${food.id}.revenueDelta`]} />
            <NumberField id={`${food.id}-goldCost`} label={`${food.name}金币成本`} value={value.goldCost} onChange={(goldCost) => updateFood(food.id, { goldCost })} error={errors[`foods.${food.id}.goldCost`]} />
            <NumberField id={`${food.id}-diamondCost`} label={`${food.name}钻石成本`} value={value.diamondCost} onChange={(diamondCost) => updateFood(food.id, { diamondCost })} error={errors[`foods.${food.id}.diamondCost`]} />
          </div>}
        </div>; })}
      </div>
    </section>

    <section className="rounded-[26px] border border-white/80 bg-white/40 p-4 shadow-[0_8px_30px_rgba(19,25,61,.1)] backdrop-blur-xl">
      <h2 className="mb-1 text-base font-semibold text-[#13193D]">④ 纪念品</h2><p className="mb-3 text-xs text-[#7A93AC]">仅填写可用库存；标准属性由系统维护。</p><div className="space-y-3">
        {calculatorData.souvenirs.map((souvenir) => { const value = request.souvenirs[souvenir.id]; if (!value) return null; return <div key={souvenir.id} className="rounded-2xl border border-[#E1EAF2] bg-white/40 p-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#41566D]" htmlFor={`souvenir-${souvenir.id}`}><input id={`souvenir-${souvenir.id}`} type="checkbox" aria-label={`允许使用${souvenir.name}`} checked={value.enabled} onChange={(event) => updateSouvenir(souvenir.id, { enabled: event.currentTarget.checked })} /><span>{souvenir.name}</span></label>
          {value.enabled && <div className="mt-3 border-t border-[#E1EAF2] pt-3">
            <div className="mb-3 rounded-xl bg-[#F5F9FC] px-3 py-2 text-xs text-[#48607A]">
              <p>第 {souvenir.slot} 槽 · 每件收入 {souvenir.perItemRevenue}</p>
              <p>{souvenir.packageSize} 件 / 包 · {souvenir.diamondPackagePrice} 钻石 / 包</p>
            </div>
            <NumberField id={`${souvenir.id}-inventory`} label={`${souvenir.name}库存`} value={value.inventory} onChange={(inventory) => updateSouvenir(souvenir.id, { inventory })} error={errors[`souvenirs.${souvenir.id}.inventory`]} />
            <p className="mt-1 text-xs text-[#7A93AC]">留空会提示填写；库存填 0 表示没有现存库存，仍可购买整包。</p>
          </div>}
        </div>; })}
      </div>
    </section>
    {message && <p className="rounded-xl border border-[#B5452F]/30 bg-[#FBEAE4] p-3 text-sm text-[#B5452F]" role="alert">{message}</p>}
    <button className="w-full rounded-[18px] bg-[#13193D] px-4 py-4 text-base font-semibold text-[#F8F2EA] shadow-[0_8px_24px_rgba(19,25,61,.28)] disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={pending}>{pending ? '计算中…' : '计算最佳方案'}</button>
  </form>;
}
