import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, smallint, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { airports } from './airports';

export const levels = pgTable(
  'levels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    airportId: uuid('airport_id').notNull().references(() => airports.id, { onDelete: 'restrict' }),
    levelType: varchar('level_type', { length: 32 }).notNull(),
    levelNumber: smallint('level_number').notNull(),
    starTargetRevenue: integer('star_target_revenue').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('levels_airport_type_number_unique').on(table.airportId, table.levelType, table.levelNumber),
    index('levels_airport_type_number_idx').on(table.airportId, table.levelType, table.levelNumber),
    check('levels_type_nonempty_check', sql`char_length(btrim(${table.levelType})) > 0`),
    check('levels_number_positive_check', sql`${table.levelNumber} >= 1`),
    check('levels_target_positive_check', sql`${table.starTargetRevenue} > 0`),
  ],
);
