// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CalculatorData } from '@/server/repositories/player-standard-data.repository';
import type { PlayerCalculationActionState } from '@/server/actions/calculate-player-plan.boundary';
import { CalculatorForm } from './calculator-form';

const calculatorData: CalculatorData = {
  city: 'new-york',
  levels: [{ number: 1, targetRevenue: 160 }],
  foods: [{ id: 'food-1', name: '经典汉堡', categoryName: '汉堡', displayOrder: 1 }],
  souvenirs: [
    { id: 'souvenir-1', slot: 1, name: '自由女神像', perItemRevenue: 30, packageSize: 5, diamondPackagePrice: 10 },
    { id: 'souvenir-2', slot: 2, name: '中央公园雪球', perItemRevenue: 20, packageSize: 5, diamondPackagePrice: 8 },
  ],
};

const successfulAction = async (): Promise<PlayerCalculationActionState> => ({
  ok: true,
  data: {
    status: 'already_starred',
    currentRevenue: 160,
    targetRevenue: 160,
    gap: 0,
    preference: 'gold_first',
  },
});

afterEach(cleanup);

describe('CalculatorForm', () => {
  it('reveals numeric food fields only after that food is selected', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm calculatorData={calculatorData} calculatePlan={successfulAction} />);

    expect(screen.queryByLabelText('经典汉堡收入增量')).toBeNull();

    await user.click(screen.getByRole('checkbox', { name: '选择经典汉堡' }));

    expect(screen.getByLabelText('经典汉堡收入增量')).not.toBeNull();
    expect(screen.getByLabelText('经典汉堡金币成本')).not.toBeNull();
    expect(screen.getByLabelText('经典汉堡钻石成本')).not.toBeNull();
  });

  it('keeps an enabled souvenir inventory blank and displays the returned field error', async () => {
    const user = userEvent.setup();
    const action = vi.fn(async (): Promise<PlayerCalculationActionState> => ({
      ok: false,
      error: {
        code: 'ValidationError',
        message: '请检查输入。',
        fieldErrors: {
          'souvenirs.souvenir-1.inventory': ['允许使用纪念品时必须填写允许为 0 的非负整数库存'],
        },
      },
    }));
    render(<CalculatorForm calculatorData={calculatorData} calculatePlan={action} />);

    await user.click(screen.getByRole('checkbox', { name: '允许使用自由女神像' }));
    expect(screen.getByText('第 1 槽 · 每件收入 30')).not.toBeNull();
    expect(screen.getByText('5 件 / 包 · 10 钻石 / 包')).not.toBeNull();
    expect(screen.getByText('留空会提示填写；库存填 0 表示没有现存库存，仍可购买整包。')).not.toBeNull();
    expect((screen.getByLabelText('自由女神像库存') as HTMLInputElement).value).toBe('');

    await user.click(screen.getByRole('button', { name: '计算最佳方案' }));

    expect(await screen.findByText('允许使用纪念品时必须填写允许为 0 的非负整数库存')).not.toBeNull();
    expect((screen.getByLabelText('自由女神像库存') as HTMLInputElement).value).toBe('');
    expect(action).toHaveBeenCalledWith(expect.objectContaining({
      souvenirs: {
        'souvenir-1': { enabled: true, inventory: '' },
        'souvenir-2': { enabled: false, inventory: '' },
      },
    }));
  });

  it('disables a second submission while the first calculation is pending', async () => {
    const user = userEvent.setup();
    let resolveAction: ((state: PlayerCalculationActionState) => void) | undefined;
    const action = vi.fn(() => new Promise<PlayerCalculationActionState>((resolve) => {
      resolveAction = resolve;
    }));
    render(<CalculatorForm calculatorData={calculatorData} calculatePlan={action} />);

    const submit = screen.getByRole('button', { name: '计算最佳方案' });
    await user.click(submit);
    await user.click(submit);

    expect(screen.getByRole('button', { name: '计算中…' })).toHaveProperty('disabled', true);
    expect(action).toHaveBeenCalledTimes(1);

    resolveAction?.({ ok: false, error: { code: 'InternalError', message: '暂时无法计算，请重试。' } });
    await waitFor(() => expect(screen.getByText('暂时无法计算，请重试。')).not.toBeNull());
  });
});
