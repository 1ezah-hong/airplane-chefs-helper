import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { z } from 'zod';

const positiveInteger = z.number().int().positive();
const newYorkStandardDataSchema = z.object({
  airport: z.object({ slug: z.literal('new-york'), displayName: z.literal('纽约') }),
  levels: z.array(z.object({ levelNumber: z.number().int().min(1).max(50), starTargetRevenue: positiveInteger })),
  foodCategories: z.array(z.object({ name: z.string().min(1) })),
  foods: z.array(z.object({ name: z.string().min(1), category: z.string().min(1), displayOrder: positiveInteger })),
  souvenirs: z.array(z.object({ slot: z.union([z.literal(1), z.literal(2)]), name: z.string().min(1), perItemRevenue: positiveInteger, packageSize: z.literal(5), diamondPackagePrice: z.number().int().min(0) })),
});

export type NewYorkStandardData = z.infer<typeof newYorkStandardDataSchema>;

const trim = (value: unknown) => String(value ?? '').trim();
const rows = (book: XLSX.WorkBook, name: string): Record<string, unknown>[] => {
  const sheet = book.Sheets[name];
  if (!sheet) throw new Error(`Workbook is missing required sheet: ${name}`);
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
};

export function normalizeNewYorkWorkbook(sourcePath: string): NewYorkStandardData {
  const workbook = XLSX.readFile(sourcePath, { cellDates: false });
  const data = {
    airport: { slug: 'new-york', displayName: '纽约' },
    levels: rows(workbook, 'levels').map((row) => ({
      sourceAirport: trim(row.airport), levelType: trim(row['level type']),
      levelNumber: Number(row['level number']), starTargetRevenue: Number(row.points),
    })).map(({ sourceAirport, levelType, ...level }) => {
      if (sourceAirport !== 'New York' || levelType !== '标准关卡') throw new Error('levels must contain only trimmed New York 标准关卡 rows.');
      return level;
    }).sort((a, b) => a.levelNumber - b.levelNumber),
    foodCategories: rows(workbook, 'food_catagories').map((row) => ({ name: trim(row.food_catagories_name) })),
    foods: rows(workbook, 'foods').map((row) => ({ name: trim(row.name), category: trim(row.category), displayOrder: Number(row.displayOrder) })),
    souvenirs: rows(workbook, 'souvenirs').map((row) => ({ slot: Number(row.slot), name: trim(row.name), perItemRevenue: Number(row.perItemRevenue), packageSize: Number(row.packageSize), diamondPackagePrice: Number(row.diamondPackagePrice) })),
  };
  return validateNewYorkStandardData(data);
}

function validateNewYorkStandardData(data: unknown): NewYorkStandardData {
  const parsed = newYorkStandardDataSchema.parse(data);
  if (parsed.levels.length !== 50 || new Set(parsed.levels.map((level) => level.levelNumber)).size !== 50) throw new Error('New York must contain exactly levels 1 through 50.');
  if (parsed.foodCategories.length !== 4 || new Set(parsed.foodCategories.map((category) => category.name)).size !== 4) throw new Error('New York must contain exactly four unique food categories.');
  if (parsed.foods.length !== 12 || new Set(parsed.foods.map((food) => food.displayOrder)).size !== 12) throw new Error('New York must contain exactly twelve uniquely ordered foods.');
  if (parsed.foods.some((food) => !parsed.foodCategories.some((category) => category.name === food.category))) throw new Error('Every food category must be present in foodCategories.');
  if (parsed.souvenirs.length !== 2 || new Set(parsed.souvenirs.map((souvenir) => souvenir.slot)).size !== 2) throw new Error('New York must contain exactly souvenir slots 1 and 2.');
  return parsed;
}

export function loadNewYorkStandardData(sourcePath: string): NewYorkStandardData {
  return validateNewYorkStandardData(JSON.parse(readFileSync(sourcePath, 'utf8')));
}
