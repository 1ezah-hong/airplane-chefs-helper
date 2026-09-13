// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ResultPage } from './result-page';

const storageKey = 'airplane-chefs:new-york:result';

function renderStoredResult(result: object, levelNumber = 2) {
  window.sessionStorage.setItem(storageKey, JSON.stringify({ levelNumber, result }));
  return render(<ResultPage />);
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe('ResultPage', () => {
  it('renders the returned success plan without recalculating it', async () => {
    renderStoredResult({
      status: 'success', preference: 'gold_first', targetRevenue: 200, currentRevenue: 150, gap: 50,
      addedRevenue: 60, finalRevenue: 210, revenueOverTarget: 10,
      selectedFoods: [{ id: 'food-1', name: '经典汉堡', categoryName: '汉堡', displayOrder: 1, revenueDelta: 40, goldCost: 90, diamondCost: 3 }],
      souvenirUses: [{ slot: 1, name: '自由女神像', quantityUsed: 1, inventoryConsumed: 1, packagesPurchased: 0, quantityPurchased: 0, remainingAfterPurchase: 2, diamondCost: 0 }],
      goldCost: 90, diamondCost: 3, goldBudgetRemaining: 10, diamondBudgetRemaining: null,
    });

    expect(await screen.findByRole('heading', { name: '已找到三星方案' })).not.toBeNull();
    expect(screen.getByText('纽约 · 第 2 关')).not.toBeNull();
    expect(screen.getByText('200')).not.toBeNull();
    expect(screen.getByText('经典汉堡')).not.toBeNull();
    expect(screen.getByText('自由女神像')).not.toBeNull();
    expect(screen.getByText('金币总计')).not.toBeNull();
    expect(screen.getByText('金币剩余').parentElement?.textContent).toBe('金币剩余10');
  });

  it('shows an already-starred conclusion without an upgrade list', async () => {
    renderStoredResult({ status: 'already_starred', preference: 'gold_first', targetRevenue: 160, currentRevenue: 180, gap: 0 });

    expect(await screen.findByRole('heading', { name: '当前已达三星' })).not.toBeNull();
    expect(screen.getByText('180')).not.toBeNull();
    expect(screen.getByText('160')).not.toBeNull();
    expect(screen.getByRole('link', { name: '返回并修改输入' })).not.toBeNull();
    expect(screen.queryByText('收入缺口')).toBeNull();
    expect(screen.queryByText('升级食物')).toBeNull();
  });

  it('shows only returned no-solution figures rather than a fake plan', async () => {
    renderStoredResult({ status: 'no_solution', preference: 'diamond_first', targetRevenue: 300, currentRevenue: 180, gap: 120, maxAdditionalRevenue: 80 });

    expect(await screen.findByRole('heading', { name: '暂无可行方案' })).not.toBeNull();
    expect(screen.getByText('120')).not.toBeNull();
    expect(screen.getByText('80')).not.toBeNull();
    expect(screen.getByText('最大可增加收入')).not.toBeNull();
    expect(screen.queryByText('升级食物')).toBeNull();
  });

  it('offers an ordinary return link when session state is missing or malformed', async () => {
    render(<ResultPage />);
    expect(await screen.findByText('暂无可显示的计算结果。')).not.toBeNull();
    expect(screen.getByRole('link', { name: '返回计算器' })).not.toBeNull();

    cleanup();
    window.sessionStorage.setItem(storageKey, JSON.stringify({ levelNumber: 2, result: { status: 'success' } }));
    render(<ResultPage />);

    expect(await screen.findByText('暂无可显示的计算结果。')).not.toBeNull();
  });
});
