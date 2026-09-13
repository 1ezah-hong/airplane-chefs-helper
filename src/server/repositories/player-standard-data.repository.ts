import 'server-only';

import { and, asc, eq, inArray } from 'drizzle-orm';
import type { DatabaseHandle } from '@/db/client';
import { airports, foodCategories, foods, levels, souvenirs } from '@/db/schema';

export interface CalculatorData {
  city: 'new-york';
  levels: readonly { number: number; targetRevenue: number }[];
  foods: readonly { id: string; name: string; categoryName: string; displayOrder: number }[];
  souvenirs: readonly {
    id: string;
    slot: 1 | 2;
    name: string;
    perItemRevenue: number;
    packageSize: 5;
    diamondPackagePrice: number;
  }[];
}

export interface CalculationAuthority {
  level: { number: number; targetRevenue: number };
  foods: readonly { id: string; name: string; categoryName: string; displayOrder: number }[];
  souvenirs: readonly {
    id: string;
    slot: 1 | 2;
    name: string;
    perItemRevenue: number;
    packageSize: 5;
    diamondPackagePrice: number;
  }[];
}

export interface PlayerStandardDataRepository {
  getCalculatorData(city: 'new-york'): Promise<CalculatorData | null>;
  getCalculationAuthority(selection: {
    city: 'new-york';
    levelNumber: number;
    foodIds: readonly string[];
    souvenirIds: readonly string[];
  }): Promise<CalculationAuthority>;
}

export class PlayerStandardDataNotFoundError extends Error {
  constructor(message = 'Selected standard data is unavailable for New York') {
    super(message);
    this.name = 'PlayerStandardDataNotFoundError';
  }
}

const isCompleteLevels = (rows: readonly { number: number }[]) =>
  rows.length === 50 && rows.every((level, index) => level.number === index + 1);

const isValidSouvenir = (souvenir: {
  slot: number;
  perItemRevenue: number;
  packageSize: number;
  diamondPackagePrice: number;
}): souvenir is { slot: 1 | 2; perItemRevenue: number; packageSize: 5; diamondPackagePrice: number } =>
  (souvenir.slot === 1 || souvenir.slot === 2)
  && souvenir.perItemRevenue > 0
  && souvenir.packageSize === 5
  && souvenir.diamondPackagePrice >= 0;

export function createPlayerStandardDataRepository(database: DatabaseHandle): PlayerStandardDataRepository {
  async function getNewYorkAirport() {
    const [airport] = await database.db
      .select({ id: airports.id })
      .from(airports)
      .where(eq(airports.slug, 'new-york'));
    return airport;
  }

  async function getCalculatorData(city: 'new-york'): Promise<CalculatorData | null> {
    if (city !== 'new-york') return null;
    const airport = await getNewYorkAirport();
    if (!airport) return null;

    const [levelRows, foodRows, souvenirRows] = await Promise.all([
      database.db
        .select({ number: levels.levelNumber, targetRevenue: levels.starTargetRevenue })
        .from(levels)
        .where(and(eq(levels.airportId, airport.id), eq(levels.levelType, 'standard')))
        .orderBy(asc(levels.levelNumber)),
      database.db
        .select({ id: foods.id, name: foods.name, categoryName: foodCategories.name, displayOrder: foods.displayOrder })
        .from(foods)
        .innerJoin(foodCategories, and(eq(foods.categoryId, foodCategories.id), eq(foodCategories.airportId, airport.id)))
        .where(eq(foods.airportId, airport.id))
        .orderBy(asc(foods.displayOrder)),
      database.db
        .select({
          id: souvenirs.id,
          slot: souvenirs.slot,
          name: souvenirs.name,
          perItemRevenue: souvenirs.perItemRevenue,
          packageSize: souvenirs.packageSize,
          diamondPackagePrice: souvenirs.diamondPackagePrice,
        })
        .from(souvenirs)
        .where(eq(souvenirs.airportId, airport.id))
        .orderBy(asc(souvenirs.slot)),
    ]);

    if (!isCompleteLevels(levelRows)
      || souvenirRows.length !== 2
      || !isValidSouvenir(souvenirRows[0] ?? { slot: 0, perItemRevenue: 0, packageSize: 0, diamondPackagePrice: -1 })
      || !isValidSouvenir(souvenirRows[1] ?? { slot: 0, perItemRevenue: 0, packageSize: 0, diamondPackagePrice: -1 })
      || souvenirRows[0]?.slot !== 1
      || souvenirRows[1]?.slot !== 2) return null;

    return {
      city: 'new-york',
      levels: levelRows,
      foods: foodRows,
      souvenirs: souvenirRows as CalculatorData['souvenirs'],
    };
  }

  async function getCalculationAuthority(selection: Parameters<PlayerStandardDataRepository['getCalculationAuthority']>[0]) {
    if (selection.city !== 'new-york'
      || new Set(selection.foodIds).size !== selection.foodIds.length
      || new Set(selection.souvenirIds).size !== selection.souvenirIds.length) {
      throw new PlayerStandardDataNotFoundError();
    }

    const airport = await getNewYorkAirport();
    if (!airport) throw new PlayerStandardDataNotFoundError();

    const [level] = await database.db
      .select({ number: levels.levelNumber, targetRevenue: levels.starTargetRevenue })
      .from(levels)
      .where(and(
        eq(levels.airportId, airport.id),
        eq(levels.levelType, 'standard'),
        eq(levels.levelNumber, selection.levelNumber),
      ));
    if (!level) throw new PlayerStandardDataNotFoundError('Selected level is unavailable for New York');

    const [selectedFoods, selectedSouvenirs] = await Promise.all([
      selection.foodIds.length === 0 ? Promise.resolve([]) : database.db
        .select({ id: foods.id, name: foods.name, categoryName: foodCategories.name, displayOrder: foods.displayOrder })
        .from(foods)
        .innerJoin(foodCategories, and(eq(foods.categoryId, foodCategories.id), eq(foodCategories.airportId, airport.id)))
        .where(and(eq(foods.airportId, airport.id), inArray(foods.id, [...selection.foodIds])))
        .orderBy(asc(foods.displayOrder)),
      selection.souvenirIds.length === 0 ? Promise.resolve([]) : database.db
        .select({
          id: souvenirs.id,
          slot: souvenirs.slot,
          name: souvenirs.name,
          perItemRevenue: souvenirs.perItemRevenue,
          packageSize: souvenirs.packageSize,
          diamondPackagePrice: souvenirs.diamondPackagePrice,
        })
        .from(souvenirs)
        .where(and(eq(souvenirs.airportId, airport.id), inArray(souvenirs.id, [...selection.souvenirIds])))
        .orderBy(asc(souvenirs.slot)),
    ]);

    if (selectedFoods.length !== selection.foodIds.length) {
      throw new PlayerStandardDataNotFoundError('Selected food is unavailable for New York');
    }
    if (selectedSouvenirs.length !== selection.souvenirIds.length
      || selectedSouvenirs.some((souvenir) => !isValidSouvenir(souvenir))
      || new Set(selectedSouvenirs.map((souvenir) => souvenir.slot)).size !== selectedSouvenirs.length) {
      throw new PlayerStandardDataNotFoundError('Selected souvenir is unavailable for New York');
    }

    return {
      level,
      foods: selectedFoods,
      souvenirs: selectedSouvenirs as CalculationAuthority['souvenirs'],
    };
  }

  return { getCalculatorData, getCalculationAuthority };
}
