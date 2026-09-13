import { describe, expect, it } from 'vitest';
import { parsePlayerCalculationRequest, toFieldErrors } from '@/lib/validation/player-calculator';

const request = () => ({
  city: 'new-york',
  levelNumber: '1',
  currentRevenue: '0',
  goldBudget: '',
  diamondBudget: '0',
  preference: 'gold_first',
  foods: {
    foodA: { selected: true, revenueDelta: '60', goldCost: '0', diamondCost: '1' },
  },
  souvenirs: {
    souvenirA: { enabled: true, inventory: '0' },
  },
});

describe('parsePlayerCalculationRequest', () => {
  it('maps blank budget and safe integer strings exactly', () => {
    expect(parsePlayerCalculationRequest(request())).toMatchObject({
      levelNumber: 1,
      currentRevenue: 0,
      goldBudget: null,
      diamondBudget: 0,
    });
  });

  it.each(['', '-1', '1.5', '1e3', '9007199254740992'])('rejects invalid current revenue %s', (currentRevenue) => {
    const value = request();
    value.currentRevenue = currentRevenue;

    expect(() => parsePlayerCalculationRequest(value)).toThrow('当前总收入必须为允许 0 的非负整数');
  });

  it('skips unchecked food but requires checked food revenue', () => {
    const value = request();
    value.foods.foodA = { selected: false, revenueDelta: '', goldCost: '', diamondCost: '' };
    expect(parsePlayerCalculationRequest(value).foods).toEqual([]);

    value.foods.foodA = { selected: true, revenueDelta: '', goldCost: '0', diamondCost: '0' };
    expect(() => parsePlayerCalculationRequest(value)).toThrow('收入增量必须为正整数');
  });

  it('requires enabled souvenir inventory', () => {
    const value = request();
    value.souvenirs.souvenirA.inventory = '';

    expect(() => parsePlayerCalculationRequest(value))
      .toThrow('允许使用纪念品时必须填写允许为 0 的非负整数库存');
  });

  it('retains nested paths as React Hook Form field keys', () => {
    expect(toFieldErrors([{ path: ['foods', 'food-a', 'revenueDelta'], message: '收入增量必须为正整数' }]))
      .toEqual({ 'foods.food-a.revenueDelta': ['收入增量必须为正整数'] });
  });
});
