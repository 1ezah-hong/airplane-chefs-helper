import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { getTestDatabase, truncateStandardData } from '@/test/db-test';
import { loadNewYorkStandardData, normalizeNewYorkWorkbook } from '@/db/seed/new-york-standard-data';
import { seedNewYorkStandardData } from '@/db/seed/seed';

const database = getTestDatabase();
const workbookPath = path.join(process.cwd(), 'AIRPALNE INFORMATION NEW YORK.xlsx');

afterAll(async () => {
  await database.close();
});

beforeEach(async () => {
  await truncateStandardData(database);
});

describe('New York standard-data seed', () => {
  it('normalizes the supplied workbook without changing its business values', () => {
    const data = normalizeNewYorkWorkbook(workbookPath);
    expect(data.airport).toEqual({ slug: 'new-york', displayName: '纽约' });
    expect(data.levels).toHaveLength(50);
    expect(data.levels.map(({ levelNumber, starTargetRevenue }) => [levelNumber, starTargetRevenue])).toEqual([
      [1, 160], [2, 320], [3, 510], [4, 520], [5, 710], [6, 640], [7, 840], [8, 740], [9, 1040], [10, 1000],
      [11, 980], [12, 1080], [13, 1120], [14, 1260], [15, 1480], [16, 1330], [17, 1500], [18, 1560], [19, 1650], [20, 1720],
      [21, 1740], [22, 1820], [23, 1900], [24, 1820], [25, 1880], [26, 1870], [27, 1930], [28, 2110], [29, 2120], [30, 2290],
      [31, 2070], [32, 2190], [33, 2100], [34, 2290], [35, 2380], [36, 2350], [37, 2420], [38, 2410], [39, 2550], [40, 2680],
      [41, 2400], [42, 2730], [43, 2770], [44, 2910], [45, 2910], [46, 3000], [47, 3090], [48, 3060], [49, 3250], [50, 3400],
    ]);
    expect(data.foodCategories).toEqual([{ name: '配菜' }, { name: '主食' }, { name: '甜品' }, { name: '饮料' }]);
    expect(data.foods).toEqual([
      { name: '泡菜', category: '配菜', displayOrder: 1 }, { name: '切片奶酪', category: '配菜', displayOrder: 2 }, { name: '蛤蜊杂烩', category: '配菜', displayOrder: 3 },
      { name: '面包', category: '主食', displayOrder: 4 }, { name: '烟熏肉', category: '主食', displayOrder: 5 }, { name: '半月曲奇', category: '甜品', displayOrder: 6 },
      { name: '芝士蛋糕', category: '甜品', displayOrder: 7 }, { name: '玻璃杯', category: '饮料', displayOrder: 8 }, { name: '奶油汽水', category: '饮料', displayOrder: 9 },
      { name: '咖啡豆', category: '饮料', displayOrder: 10 }, { name: '咖啡杯', category: '饮料', displayOrder: 11 }, { name: '牛奶', category: '饮料', displayOrder: 12 },
    ]);
    expect(data.souvenirs).toEqual([
      { slot: 1, name: '自由帽', perItemRevenue: 60, packageSize: 5, diamondPackagePrice: 1 },
      { slot: 2, name: '苹果徽章', perItemRevenue: 130, packageSize: 5, diamondPackagePrice: 2 },
    ]);
    expect(loadNewYorkStandardData(path.join(process.cwd(), 'data', 'new-york-standard-data.json'))).toEqual(data);
  });

  it('inserts New York complete standard data once without overwriting an existing row', async () => {
    const data = normalizeNewYorkWorkbook(workbookPath);
    await seedNewYorkStandardData(database, data);
    await seedNewYorkStandardData(database, data);

    const airports = await database.sql<{ slug: string; display_name: string }[]>`
      select slug, display_name from airports order by slug
    `;
    const levelCount = await database.sql<{ count: number }[]>`
      select count(*)::int as count from levels
    `;
    expect(airports).toEqual([{ slug: 'new-york', display_name: '纽约' }]);
    expect(levelCount).toEqual([{ count: 50 }]);

    expect(await database.sql<{ count: number }[]>`select count(*)::int as count from food_categories`).toEqual([{ count: 4 }]);
    expect(await database.sql<{ count: number }[]>`select count(*)::int as count from foods`).toEqual([{ count: 12 }]);
    expect(await database.sql<{ count: number }[]>`select count(*)::int as count from souvenirs`).toEqual([{ count: 2 }]);

    await database.sql`
      update levels
      set star_target_revenue = 9999
      where level_number = 1
    `;
    await seedNewYorkStandardData(database, data);
    const [firstLevel] = await database.sql<{ star_target_revenue: number }[]>`
      select star_target_revenue from levels where level_number = 1
    `;
    expect(firstLevel.star_target_revenue).toBe(9999);
  }, 20_000);

  it('preserves an administrator food that occupies a seeded display order', async () => {
    const data = normalizeNewYorkWorkbook(workbookPath);
    await seedNewYorkStandardData(database, data);

    const [airport] = await database.sql<{ id: string }[]>`
      select id from airports where slug = 'new-york'
    `;
    const [category] = await database.sql<{ id: string }[]>`
      select id from food_categories where airport_id = ${airport.id} and name_key = '配菜'
    `;
    await database.sql`delete from foods where airport_id = ${airport.id} and display_order = 1`;
    await database.sql`
      insert into foods (airport_id, category_id, name, name_key, display_order)
      values (${airport.id}, ${category.id}, '管理员食物', '管理员食物', 1)
    `;

    await expect(seedNewYorkStandardData(database, data)).resolves.toBeUndefined();
    const foodsAtFirstDisplayOrder = await database.sql<{
      name: string;
      name_key: string;
      display_order: number;
    }[]>`
      select name, name_key, display_order
      from foods
      where airport_id = ${airport.id} and display_order = 1
    `;
    expect(foodsAtFirstDisplayOrder).toEqual([
      { name: '管理员食物', name_key: '管理员食物', display_order: 1 },
    ]);
    expect(await database.sql<{ count: number }[]>`select count(*)::int as count from foods`).toEqual([{ count: 12 }]);
  }, 20_000);
});
