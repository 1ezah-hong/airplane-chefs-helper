import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import type { DatabaseHandle } from '../client';
import { airports, foodCategories, foods, levels, souvenirs } from '../schema';
import { parseServerEnv } from '../../lib/env.schema';
import { createDatabase } from '../client';
import { loadNewYorkStandardData, type NewYorkStandardData } from './new-york-standard-data';

export async function seedNewYorkStandardData(
  database: DatabaseHandle,
  data: NewYorkStandardData,
): Promise<void> {
  await database.db.transaction(async (tx) => {
    await tx
      .insert(airports)
      .values(data.airport)
      .onConflictDoNothing({ target: airports.slug });

    const [newYork] = await tx
      .select({ id: airports.id })
      .from(airports)
      .where(eq(airports.slug, 'new-york'));

    if (!newYork) throw new Error('New York airport seed row was not found after insertion.');

    await tx
      .insert(levels)
      .values(data.levels.map((level) => ({
        airportId: newYork.id,
        levelType: 'standard',
        levelNumber: level.levelNumber,
        starTargetRevenue: level.starTargetRevenue,
      })))
      .onConflictDoNothing({ target: [levels.airportId, levels.levelType, levels.levelNumber] });

    await tx
      .insert(foodCategories)
      .values(data.foodCategories.map((category) => ({
        airportId: newYork.id,
        name: category.name,
        nameKey: category.name,
      })))
      .onConflictDoNothing({ target: [foodCategories.airportId, foodCategories.nameKey] });

    const categories = await tx
      .select({ id: foodCategories.id, nameKey: foodCategories.nameKey })
      .from(foodCategories)
      .where(eq(foodCategories.airportId, newYork.id));
    const categoryIds = new Map(categories.map((category) => [category.nameKey, category.id]));
    const foodValues = data.foods.map((food) => {
      const categoryId = categoryIds.get(food.category);
      if (!categoryId) throw new Error(`Seed category not found: ${food.category}`);
      return {
        airportId: newYork.id,
        categoryId,
        name: food.name,
        nameKey: food.name,
        displayOrder: food.displayOrder,
      };
    });
    await tx
      .insert(foods)
      .values(foodValues)
      .onConflictDoNothing();

    await tx
      .insert(souvenirs)
      .values(data.souvenirs.map((souvenir) => ({ airportId: newYork.id, ...souvenir })))
      .onConflictDoNothing({ target: [souvenirs.airportId, souvenirs.slot] });
  });
}

async function main(): Promise<void> {
  const database = createDatabase(parseServerEnv(process.env).DATABASE_URL);
  try {
    const data = loadNewYorkStandardData(path.join(process.cwd(), 'data', 'new-york-standard-data.json'));
    await seedNewYorkStandardData(database, data);
  } finally {
    await database.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
