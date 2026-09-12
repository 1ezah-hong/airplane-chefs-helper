import { sql } from 'drizzle-orm';
import { check, foreignKey, index, pgTable, smallint, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { airports } from './airports';
import { foodCategories } from './food-categories';

export const foods = pgTable(
  'foods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    airportId: uuid('airport_id').notNull().references(() => airports.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    nameKey: varchar('name_key', { length: 100 }).notNull(),
    displayOrder: smallint('display_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('foods_airport_name_key_unique').on(table.airportId, table.nameKey),
    unique('foods_airport_display_order_unique').on(table.airportId, table.displayOrder),
    index('foods_airport_display_order_idx').on(table.airportId, table.displayOrder),
    foreignKey({
      columns: [table.categoryId, table.airportId],
      foreignColumns: [foodCategories.id, foodCategories.airportId],
      name: 'foods_category_airport_fk',
    }).onDelete('restrict'),
    check('foods_name_nonempty_check', sql`char_length(btrim(${table.name})) > 0`),
    check('foods_name_key_nonempty_check', sql`char_length(btrim(${table.nameKey})) > 0`),
    check('foods_display_order_positive_check', sql`${table.displayOrder} >= 1`),
  ],
);
