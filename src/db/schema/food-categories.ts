import { sql } from 'drizzle-orm';
import { check, index, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { airports } from './airports';

export const foodCategories = pgTable(
  'food_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    airportId: uuid('airport_id').notNull().references(() => airports.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 100 }).notNull(),
    nameKey: varchar('name_key', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('food_categories_airport_name_key_unique').on(table.airportId, table.nameKey),
    unique('food_categories_id_airport_unique').on(table.id, table.airportId),
    index('food_categories_airport_idx').on(table.airportId),
    check('food_categories_name_nonempty_check', sql`char_length(btrim(${table.name})) > 0`),
    check('food_categories_name_key_nonempty_check', sql`char_length(btrim(${table.nameKey})) > 0`),
  ],
);
