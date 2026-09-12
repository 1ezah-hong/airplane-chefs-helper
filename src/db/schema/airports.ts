import { sql } from 'drizzle-orm';
import { check, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

export const airports = pgTable(
  'airports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 63 }).notNull(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('airports_slug_unique').on(table.slug),
    check('airports_slug_format_check', sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    check('airports_display_name_nonempty_check', sql`char_length(btrim(${table.displayName})) > 0`),
  ],
);
