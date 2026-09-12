import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, smallint, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { airports } from './airports';

export const souvenirs = pgTable(
  'souvenirs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    airportId: uuid('airport_id').notNull().references(() => airports.id, { onDelete: 'restrict' }),
    slot: smallint('slot').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    perItemRevenue: integer('per_item_revenue').notNull(),
    packageSize: smallint('package_size').default(5).notNull(),
    diamondPackagePrice: integer('diamond_package_price').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('souvenirs_airport_slot_unique').on(table.airportId, table.slot),
    index('souvenirs_airport_idx').on(table.airportId),
    check('souvenirs_slot_check', sql`${table.slot} in (1, 2)`),
    check('souvenirs_name_nonempty_check', sql`char_length(btrim(${table.name})) > 0`),
    check('souvenirs_revenue_positive_check', sql`${table.perItemRevenue} > 0`),
    check('souvenirs_package_size_five_check', sql`${table.packageSize} = 5`),
    check('souvenirs_diamond_price_nonnegative_check', sql`${table.diamondPackagePrice} >= 0`),
  ],
);
