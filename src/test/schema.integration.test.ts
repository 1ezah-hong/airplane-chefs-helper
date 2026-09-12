import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { getTestDatabase, truncateStandardData } from '@/test/db-test';

const database = getTestDatabase();

afterAll(async () => {
  await database.close();
});

beforeEach(async () => {
  await truncateStandardData(database);
});

describe('standard-data schema', () => {
  it('enforces airport, level and category uniqueness and checks', async () => {
    await database.sql`insert into airports (slug, display_name) values ('new-york', '纽约')`;
    await expect(
      database.sql`insert into airports (slug, display_name) values ('new-york', '重复纽约')`,
    ).rejects.toThrow(/unique/i);
    await expect(
      database.sql`insert into airports (slug, display_name) values ('New-York', '非法 slug')`,
    ).rejects.toThrow(/check/i);

    const [airport] = await database.sql<{ id: string }[]>`select id from airports where slug = 'new-york'`;
    await database.sql`insert into levels (airport_id, level_type, level_number, star_target_revenue) values (${airport.id}, 'standard', 1, 230)`;
    await expect(
      database.sql`insert into levels (airport_id, level_type, level_number, star_target_revenue) values (${airport.id}, 'standard', 1, 231)`,
    ).rejects.toThrow(/unique/i);
    await expect(
      database.sql`insert into levels (airport_id, level_type, level_number, star_target_revenue) values (${airport.id}, 'standard', 2, 0)`,
    ).rejects.toThrow(/check/i);
  });

  it('enforces same-airport food categories and contains no player-cost columns', async () => {
    await database.sql`insert into airports (slug, display_name) values ('new-york', '纽约'), ('tokyo', '东京')`;
    const airports = await database.sql<{ id: string; slug: string }[]>`select id, slug from airports order by slug`;
    const newYork = airports.find((airport) => airport.slug === 'new-york');
    const tokyo = airports.find((airport) => airport.slug === 'tokyo');
    if (!newYork || !tokyo) throw new Error('test airports were not created');

    await database.sql`insert into food_categories (airport_id, name, name_key) values (${newYork.id}, '主菜', '主菜')`;
    const [category] = await database.sql<{ id: string }[]>`select id from food_categories where airport_id = ${newYork.id}`;
    await database.sql`insert into foods (airport_id, category_id, name, name_key, display_order) values (${newYork.id}, ${category.id}, '小笼包', '小笼包', 1)`;
    await expect(
      database.sql`insert into foods (airport_id, category_id, name, name_key, display_order) values (${tokyo.id}, ${category.id}, '寿司', '寿司', 1)`,
    ).rejects.toThrow(/foreign key/i);

    const forbiddenColumns = await database.sql<{ column_name: string }[]>`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'foods'
        and column_name in ('revenue_delta', 'gold_cost', 'diamond_cost', 'level', 'prerequisite')
    `;
    expect(forbiddenColumns).toEqual([]);
  });

  it('restricts souvenirs to slots 1 and 2 with a package size of 5', async () => {
    await database.sql`insert into airports (slug, display_name) values ('new-york', '纽约')`;
    const [airport] = await database.sql<{ id: string }[]>`select id from airports where slug = 'new-york'`;
    await database.sql`insert into souvenirs (airport_id, slot, name, per_item_revenue, diamond_package_price) values (${airport.id}, 1, '纪念品 A', 100, 1)`;
    await expect(
      database.sql`insert into souvenirs (airport_id, slot, name, per_item_revenue, diamond_package_price) values (${airport.id}, 1, '纪念品 B', 110, 2)`,
    ).rejects.toThrow(/unique/i);
    await expect(
      database.sql`insert into souvenirs (airport_id, slot, name, per_item_revenue, package_size, diamond_package_price) values (${airport.id}, 3, '纪念品 C', 120, 5, 3)`,
    ).rejects.toThrow(/check/i);
    await expect(
      database.sql`insert into souvenirs (airport_id, slot, name, per_item_revenue, package_size, diamond_package_price) values (${airport.id}, 2, '纪念品 B', 110, 4, 2)`,
    ).rejects.toThrow(/check/i);
  });

  it('updates updated_at through the database trigger', async () => {
    await database.sql`insert into airports (slug, display_name) values ('new-york', '纽约')`;
    const [before] = await database.sql<{ updated_at: string | Date }[]>`
      select updated_at from airports where slug = 'new-york'
    `;
    await database.sql`select pg_sleep(0.01)`;
    await database.sql`update airports set display_name = '纽约机场' where slug = 'new-york'`;
    const [after] = await database.sql<{ updated_at: string | Date }[]>`
      select updated_at from airports where slug = 'new-york'
    `;
    expect(new Date(after.updated_at).getTime()).toBeGreaterThan(new Date(before.updated_at).getTime());
  });
});
