# Foundation & Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the runnable Next.js foundation and the PostgreSQL/Drizzle standard-data persistence layer for the Chefs Help Chefs MVP.

**Architecture:** Build one TypeScript Next.js App Router project with Tailwind and a Node-based Vitest runner. Keep database connection/configuration in server-only modules and represent the TECH-SPEC standard-data schema in Drizzle with a generated, versioned PostgreSQL migration. Normalize the supplied New York workbook into a version-controlled JSON input, validate it, then idempotently seed New York’s complete confirmed standard data without overwriting administrator-maintained rows.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Zod, Drizzle ORM/Drizzle Kit, `postgres` driver, Supabase PostgreSQL, npm.

**Specs:** `docs/PRD.md`, `docs/UX-SPEC.md`, `docs/UI-SPEC-users.md`, `docs/UI-SPEC-admin.md`, `docs/TECH-SPEC.md`

## Global Constraints

- Build a module-oriented monolith; do not introduce a second backend, Redis, queues, Supabase Auth/Storage/Realtime, Prisma, GraphQL, tRPC, Redux, or client-side database access.
- Use Next.js App Router, TypeScript, React and Tailwind CSS. This plan adds no player workflow, admin workflow, calculation engine, authentication, CSV/XLSX, Server Action, Route Handler, Figma UI, or deployment implementation.
- Standard data belongs only in PostgreSQL. 玩家输入不得入库：current revenue、budgets、preference、selected-food values、souvenir inventory、drafts and results must not receive a table, column, seed value or persistence function.
- Store food names, category references and fixed `display_order` only. Never add food income, gold-cost, diamond-cost, level, prerequisite or upgrade-chain columns.
- Use UUID primary keys, `timestamptz` audit fields, PostgreSQL `integer` for income/cost/quantity values, and no floating-point numeric domain fields.
- Every database connection string remains server-only. Do not create an environment variable with a `NEXT_PUBLIC_` database prefix.
- Use a dedicated disposable `TEST_DATABASE_URL` for integration tests. Never run schema reset tests against a production or preview database.
- Preserve the four product/design specification files and `docs/TECH-SPEC.md` exactly. This plan creates only source, configuration, test, migration, seed and developer-documentation files.
- `AIRPALNE INFORMATION NEW YORK.xlsx` is the sole source for New York standard data. Task 4 reads it only to create and verify `data/new-york-standard-data.json`; it trims permitted whitespace and maps source structural names only, never changes a business value.
- The production seed reads the verified JSON and creates New York, 50 Levels, 4 FoodCategory rows, 12 Food rows in source `displayOrder`, and Souvenir slots 1 and 2. Its behavior is idempotent and never overwrites an existing administrator-maintained standard-data row.
- The generic CSV/XLSX import/export product workflow remains out of scope. The one-time, version-controlled Excel-to-JSON normalization is a Foundation seed-input build step, not an admin import feature.

---

## File Structure

```text
.
├─ .env.example                         Safe local connection-string example only
├─ drizzle.config.ts                    Drizzle Kit schema/migration configuration
├─ package.json                         Scripts and project dependencies
├─ src/
│  ├─ app/
│  │  ├─ globals.css                    Tailwind entry stylesheet
│  │  ├─ layout.tsx                     Minimal App Router root layout
│  │  └─ page.tsx                       Minimal neutral foundation route
│  ├─ db/
│  │  ├─ client.ts                      Server-only, lazy PostgreSQL/Drizzle factory
│  │  ├─ migrate.ts                     Versioned migration runner
│  │  ├─ schema/
│  │  │  ├─ airports.ts                 airports table
│  │  │  ├─ levels.ts                   levels table
│  │  │  ├─ food-categories.ts          food_categories table
│  │  │  ├─ foods.ts                    foods table and same-airport FK
│  │  │  ├─ souvenirs.ts                souvenirs table
│  │  │  └─ index.ts                    Single schema export for Drizzle
│  │  └─ seed/
│  │     ├─ new-york-standard-data.ts   Parse/validate Excel and canonical JSON
│  │     ├─ build-new-york-data.ts      Generate canonical JSON from the supplied workbook
│  │     └─ seed.ts                     Idempotent New York complete standard-data seed
│  ├─ lib/
│  │  ├─ env.schema.ts                  Pure environment schema/parser
│  │  └─ env.server.ts                  Server-only resolved environment
│  └─ test/
│     ├─ setup-env.ts                   Vitest test-environment checks
│     ├─ server-only.ts                  Empty Vitest-only server-only shim
│     ├─ db-test.ts                     Dedicated DB URL and cleanup helpers
│     ├─ env.server.test.ts             Unit tests for environment parsing
│     ├─ db-client.integration.test.ts  PostgreSQL connectivity test
│     ├─ schema.integration.test.ts     Constraint/index/schema integration tests
│     └─ new-york-seed.integration.test.ts  Normalization and idempotency tests
├─ data/
│  └─ new-york-standard-data.json    Version-controlled canonical standard-data input
├─ vitest.config.ts                     Node Vitest configuration and `@/` alias
└─ src/db/migrations/                   Drizzle-generated SQL and metadata
```

The exact generated migration filename is recorded by Drizzle Kit in `src/db/migrations/meta/_journal.json`; use the generated name emitted by `npm run db:generate` and commit both that SQL file and every generated `meta/` file. Do not rename a generated migration after it has been applied.

### Task 1: Bootstrap the App Runner, Test Runner, and Environment Parser

**Files:**
- Create: `package.json` and `package-lock.json` through the Next.js generator
- Create: `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` through the Next.js generator
- Create: `.env.example`
- Create: `vitest.config.ts`
- Create: `src/lib/env.schema.ts`
- Create: `src/lib/env.server.ts`
- Create: `src/test/setup-env.ts`
- Create: `src/test/server-only.ts`
- Test: `src/test/env.server.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: no application interfaces.
- Produces: `parseServerEnv(input: NodeJS.ProcessEnv): ServerEnv`, where `ServerEnv` is `{ DATABASE_URL: string }`, plus the server-only `serverEnv` resolved value.
- Produces: `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run test:watch`, `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed` scripts.

- [ ] **Step 1: Scaffold the Next.js project in the current repository without touching `docs/` or `AIRPALNE INFORMATION NEW YORK.xlsx`.**

  Run the generator in a temporary directory, then copy only generated project files into the repository root. This avoids a generator refusal caused by the existing documentation and prevents overwriting it.

  ```bash
  workspace_tmp=$(mktemp -d)
  npx create-next-app@latest "$workspace_tmp/chc" \
    --ts --tailwind --eslint --app --src-dir --import-alias '@/*' --use-npm --yes
  rsync -a --exclude '.git' "$workspace_tmp/chc/" ./
  ```

  Keep the generator's current stable Next.js/React/Tailwind versions and its lockfile. Verify `docs/PRD.md` and `AIRPALNE INFORMATION NEW YORK.xlsx` are still present before continuing. Task 4 alone generates `data/new-york-standard-data.json` from that workbook.

- [ ] **Step 2: Install the foundation-only server, migration, validation and test dependencies and define exact scripts.**

  Run:

  ```bash
  npm install drizzle-orm postgres zod
  npm install --save-dev drizzle-kit dotenv tsx vitest
  ```

  Merge these scripts into `package.json`; preserve the generator's existing scripts unless the same key must be replaced.

  ```json
  {
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "lint": "eslint .",
      "test": "vitest run",
      "test:watch": "vitest",
      "db:generate": "drizzle-kit generate",
      "db:migrate": "tsx src/db/migrate.ts",
      "db:seed": "tsx src/db/seed/seed.ts"
    }
  }
  ```

- [ ] **Step 3: Configure Vitest and add a safe environment-variable example.**

  Create `vitest.config.ts`:

  ```ts
  import { fileURLToPath } from 'node:url';
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'server-only': fileURLToPath(new URL('./src/test/server-only.ts', import.meta.url)),
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      setupFiles: ['./src/test/setup-env.ts'],
      clearMocks: true,
      restoreMocks: true,
    },
  });
  ```

  Create `src/test/setup-env.ts`:

  ```ts
  import { beforeEach } from 'vitest';

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });
  ```

  Create `src/test/server-only.ts`:

  ```ts
  export {};
  ```

  The alias is used only by Vitest. Next.js resolves the real `server-only` package in application builds, preserving the client-import boundary.

  Create `.env.example` with a deliberately local, non-secret value:

  ```dotenv
  DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
  ```

  Add `.env`, `.env.local`, `.env.test`, and `.env.*.local` to `.gitignore`, while retaining `.env.example` in source control.

- [ ] **Step 4: Write the failing environment-parser unit test.**

  Create `src/test/env.server.test.ts` before creating `src/lib/env.schema.ts`:

  ```ts
  import { describe, expect, it } from 'vitest';
  import { parseServerEnv } from '@/lib/env.schema';

  describe('parseServerEnv', () => {
    it('accepts a PostgreSQL connection URL', () => {
      expect(
        parseServerEnv({
          DATABASE_URL: 'postgresql://user:password@db.example.test:5432/chc',
        }),
      ).toEqual({
        DATABASE_URL: 'postgresql://user:password@db.example.test:5432/chc',
      });
    });

    it('rejects a missing DATABASE_URL', () => {
      expect(() => parseServerEnv({})).toThrow('DATABASE_URL');
    });

    it('rejects a non-PostgreSQL URL', () => {
      expect(() =>
        parseServerEnv({ DATABASE_URL: 'https://db.example.test' }),
      ).toThrow('postgresql://');
    });
  });
  ```

- [ ] **Step 5: Run the focused test and confirm the red state.**

  Run:

  ```bash
  npm run test -- src/test/env.server.test.ts
  ```

  Expected: **FAIL** because `@/lib/env.server` does not exist.

- [ ] **Step 6: Implement the minimal server-only environment parser.**

  Create `src/lib/env.schema.ts`:

  ```ts
  import { z } from 'zod';

  const databaseUrl = z
    .string()
    .url()
    .refine(
      (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
      'DATABASE_URL must use postgres:// or postgresql://',
    );

  const serverEnvSchema = z.object({
    DATABASE_URL: databaseUrl,
  });

  export type ServerEnv = z.infer<typeof serverEnvSchema>;

  export function parseServerEnv(input: NodeJS.ProcessEnv): ServerEnv {
    return serverEnvSchema.parse({ DATABASE_URL: input.DATABASE_URL });
  }
  ```

  Create `src/lib/env.server.ts`:

  ```ts
  import 'server-only';
  import { parseServerEnv } from './env.schema';

  export { parseServerEnv, type ServerEnv } from './env.schema';

  export const serverEnv = parseServerEnv(process.env);
  ```

- [ ] **Step 7: Run the focused test, full unit suite, lint and build.**

  Run:

  ```bash
  npm run test -- src/test/env.server.test.ts
  npm run test
  npm run lint
  npm run build
  ```

  Expected: the focused test and full suite **PASS**; lint exits 0; production build exits 0. A database URL is not required for this task because no module connects during page rendering or build.

- [ ] **Step 8: Commit the bootstrap and environment-parser deliverable.**

  ```bash
  git add package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs postcss.config.mjs .gitignore .env.example vitest.config.ts src/app src/lib/env.schema.ts src/lib/env.server.ts src/test/setup-env.ts src/test/server-only.ts src/test/env.server.test.ts
  git commit -m "chore: bootstrap Next.js foundation"
  ```

### Task 2: Add Server-Only Drizzle/PostgreSQL Connectivity

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/db/client.ts`
- Create: `src/db/migrate.ts`
- Create: `src/db/schema/index.ts`
- Test: `src/test/db-client.integration.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `parseServerEnv(input)` from `src/lib/env.schema.ts`.
- Produces: `createDatabase(connectionString: string): DatabaseHandle`.
- Produces: `DatabaseHandle` with `{ db, sql, close(): Promise<void> }`; later schema, repository, migration and seed code use this exact factory.
- Produces: `runMigrations(connectionString: string): Promise<void>`.

- [ ] **Step 1: Add an explicit test-database script and minimal empty schema barrel.**

  Add this script to `package.json`:

  ```json
  {
    "db:migrate:test": "DATABASE_URL=$TEST_DATABASE_URL tsx src/db/migrate.ts"
  }
  ```

  Create `src/db/schema/index.ts` as a valid empty export until Task 3 adds tables:

  ```ts
  export {};
  ```

  `TEST_DATABASE_URL` must point to a dedicated disposable Postgres database. Do not put it in `.env.example`; it is an operator-provided local/CI secret.

- [ ] **Step 2: Write the failing database connectivity integration test.**

  Create `src/test/db-client.integration.test.ts` before creating `src/db/client.ts`:

  ```ts
  import { afterAll, describe, expect, it } from 'vitest';
  import { createDatabase } from '@/db/client';

  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error('Set TEST_DATABASE_URL to a dedicated test PostgreSQL database.');
  }

  const database = createDatabase(connectionString);

  afterAll(async () => {
    await database.close();
  });

  describe('database client', () => {
    it('executes a parameterized PostgreSQL health query', async () => {
      const rows = await database.sql<{ value: number }[]>`select 1::int as value`;
      expect(rows).toEqual([{ value: 1 }]);
    });
  });
  ```

- [ ] **Step 3: Run the focused integration test and confirm the red state.**

  Run:

  ```bash
  TEST_DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run test -- src/test/db-client.integration.test.ts
  ```

  Expected: **FAIL** because `@/db/client` does not exist. Replace the example URL with the dedicated test database URL before running; never paste a real URL into source control.

- [ ] **Step 4: Implement the database factory, Drizzle Kit configuration and migration runner.**

  Create `src/db/client.ts`:

  ```ts
  import 'server-only';
  import { drizzle } from 'drizzle-orm/postgres-js';
  import postgres from 'postgres';

  export function createDatabase(connectionString: string) {
    const sql = postgres(connectionString, {
      max: 1,
      prepare: false,
    });

    return {
      db: drizzle(sql),
      sql,
      close: () => sql.end({ timeout: 5 }),
    };
  }

  export type DatabaseHandle = ReturnType<typeof createDatabase>;
  ```

  Create `drizzle.config.ts`:

  ```ts
  import 'dotenv/config';
  import { defineConfig } from 'drizzle-kit';
  import { parseServerEnv } from './src/lib/env.schema';

  const env = parseServerEnv(process.env);

  export default defineConfig({
    dialect: 'postgresql',
    schema: './src/db/schema/index.ts',
    out: './src/db/migrations',
    dbCredentials: { url: env.DATABASE_URL },
    strict: true,
    verbose: true,
  });
  ```

  Create `src/db/migrate.ts`:

  ```ts
  import 'dotenv/config';
  import path from 'node:path';
  import { migrate } from 'drizzle-orm/postgres-js/migrator';
  import { createDatabase } from './client';
  import { parseServerEnv } from '../lib/env.schema';

  export async function runMigrations(connectionString: string): Promise<void> {
    const database = createDatabase(connectionString);

    try {
      await migrate(database.db, {
        migrationsFolder: path.join(process.cwd(), 'src/db/migrations'),
      });
    } finally {
      await database.close();
    }
  }

  void runMigrations(parseServerEnv(process.env).DATABASE_URL);
  ```

  Do not export a process-global `db` instance yet. It would connect during test/build module evaluation; the future repository layer will acquire a lazy server-only handle after its schema is available.

- [ ] **Step 5: Run the focused integration test and verify the green state.**

  Run:

  ```bash
  TEST_DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run test -- src/test/db-client.integration.test.ts
  ```

  Expected: **PASS** with one successful `select 1` assertion.

- [ ] **Step 6: Run all current checks.**

  Run:

  ```bash
  npm run test
  npm run lint
  npm run build
  ```

  Expected: **PASS**, exit 0 for all commands. The test command requires `TEST_DATABASE_URL`; if it is absent, the integration test fails by design with its explicit safety message.

- [ ] **Step 7: Commit the database-connectivity deliverable.**

  ```bash
  git add package.json package-lock.json drizzle.config.ts src/db/client.ts src/db/migrate.ts src/db/schema/index.ts src/test/db-client.integration.test.ts
  git commit -m "feat: add Drizzle PostgreSQL connection"
  ```

### Task 3: Define and Migrate the Standard-Data Schema

**Files:**
- Create: `src/db/schema/airports.ts`
- Create: `src/db/schema/levels.ts`
- Create: `src/db/schema/food-categories.ts`
- Create: `src/db/schema/foods.ts`
- Create: `src/db/schema/souvenirs.ts`
- Modify: `src/db/schema/index.ts`
- Create: `src/db/migrations/<Drizzle-generated foundation migration>.sql`
- Create: `src/db/migrations/meta/_journal.json` and Drizzle-generated snapshot metadata
- Create: `src/test/db-test.ts`
- Test: `src/test/schema.integration.test.ts`
- Modify: `src/db/client.ts`

**Interfaces:**
- Consumes: `createDatabase(connectionString)` from `src/db/client.ts`.
- Produces: `airports`, `levels`, `foodCategories`, `foods`, `souvenirs` Drizzle table exports and a single `schema` object.
- Produces: SQL-enforced primary keys, foreign keys, unique constraints, CHECK constraints, indexes and `updated_at` triggers defined in TECH-SPEC section 8.
- Produces: `getTestDatabase(): DatabaseHandle` and `truncateStandardData(database): Promise<void>` for integration tests only.

- [ ] **Step 1: Write the failing schema integration test.**

  Create `src/test/db-test.ts`:

  ```ts
  import { createDatabase, type DatabaseHandle } from '@/db/client';

  export function getTestDatabase(): DatabaseHandle {
    const connectionString = process.env.TEST_DATABASE_URL;

    if (!connectionString) {
      throw new Error('Set TEST_DATABASE_URL to a dedicated test PostgreSQL database.');
    }

    return createDatabase(connectionString);
  }

  export async function truncateStandardData(database: DatabaseHandle): Promise<void> {
    await database.sql.unsafe(
      'TRUNCATE TABLE foods, souvenirs, food_categories, levels, airports RESTART IDENTITY CASCADE',
    );
  }
  ```

  Create `src/test/schema.integration.test.ts`:

  ```ts
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
      const [before] = await database.sql<{ updated_at: Date }[]>`
        select updated_at from airports where slug = 'new-york'
      `;
      await database.sql`select pg_sleep(0.01)`;
      await database.sql`update airports set display_name = '纽约机场' where slug = 'new-york'`;
      const [after] = await database.sql<{ updated_at: Date }[]>`
        select updated_at from airports where slug = 'new-york'
      `;
      expect(after.updated_at.getTime()).toBeGreaterThan(before.updated_at.getTime());
    });
  });
  ```

- [ ] **Step 2: Run the schema test before creating tables and confirm the red state.**

  Run:

  ```bash
  TEST_DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run test -- src/test/schema.integration.test.ts
  ```

  Expected: **FAIL** with `relation "foods" does not exist` or `relation "airports" does not exist`. Do not run the test against a non-disposable database.

- [ ] **Step 3: Define the five Drizzle tables exactly once.**

  Create `src/db/schema/airports.ts`:

  ```ts
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
  ```

  Create `src/db/schema/levels.ts`:

  ```ts
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
  ```

  Create `src/db/schema/food-categories.ts`:

  ```ts
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
  ```

  Create `src/db/schema/foods.ts`:

  ```ts
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
  ```

  Create `src/db/schema/souvenirs.ts`:

  ```ts
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
  ```

  Replace `src/db/schema/index.ts` with:

  ```ts
  export * from './airports';
  export * from './levels';
  export * from './food-categories';
  export * from './foods';
  export * from './souvenirs';

  import { airports } from './airports';
  import { foodCategories } from './food-categories';
  import { foods } from './foods';
  import { levels } from './levels';
  import { souvenirs } from './souvenirs';

  export const schema = { airports, levels, foodCategories, foods, souvenirs };
  ```

  Finally change `src/db/client.ts` to use that one schema object:

  ```ts
  import { schema } from './schema';

  // Replace `db: drizzle(sql),` with:
  db: drizzle(sql, { schema }),
  ```

- [ ] **Step 4: Generate the migration, then add the required PostgreSQL timestamp trigger to the generated SQL.**

  Run:

  ```bash
  DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run db:generate -- --name foundation_schema
  ```

  In the generated foundation migration, place this SQL after table creation statements and before the migration ends:

  ```sql
  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$;

  CREATE TRIGGER airports_set_updated_at BEFORE UPDATE ON airports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER levels_set_updated_at BEFORE UPDATE ON levels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER food_categories_set_updated_at BEFORE UPDATE ON food_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER foods_set_updated_at BEFORE UPDATE ON foods
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  CREATE TRIGGER souvenirs_set_updated_at BEFORE UPDATE ON souvenirs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  ```

  Ensure the generated SQL begins with:

  ```sql
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  ```

  `gen_random_uuid()` is the UUID default used by Drizzle and needs this extension available on PostgreSQL/Supabase.

- [ ] **Step 5: Apply the migration to the dedicated test database.**

  Run:

  ```bash
  TEST_DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run db:migrate:test
  ```

  Expected: **PASS**, applying exactly the new foundation migration and recording it in Drizzle's migration journal.

- [ ] **Step 6: Run the focused schema test and verify the green state.**

  Run:

  ```bash
  TEST_DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run test -- src/test/schema.integration.test.ts
  ```

  Expected: **PASS**. The test proves the Level unique/positive rules, airport slug restriction, cross-airport category FK, absence of player cost columns, Souvenir slot/package constraints and database-managed `updated_at` behavior against real PostgreSQL.

- [ ] **Step 7: Inspect the actual PostgreSQL indexes and trigger before committing.**

  Run this against the dedicated test database:

  ```sql
  SELECT indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('levels', 'food_categories', 'foods', 'souvenirs')
  ORDER BY tablename, indexname;

  SELECT tgrelid::regclass::text AS table_name, tgname
  FROM pg_trigger
  WHERE tgname IN (
    'airports_set_updated_at',
    'levels_set_updated_at',
    'food_categories_set_updated_at',
    'foods_set_updated_at',
    'souvenirs_set_updated_at'
  )
  ORDER BY table_name;
  ```

  Expected: indexes for the specified airport-oriented lookup/uniqueness constraints and all five `*_set_updated_at` triggers are present.

- [ ] **Step 8: Run the complete foundation check set.**

  Run:

  ```bash
  TEST_DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run test
  npm run lint
  npm run build
  ```

  Expected: **PASS**, exit 0 for all commands. No player or admin route is added by this task.

- [ ] **Step 9: Commit the schema and migration deliverable.**

  ```bash
  git add src/db/schema src/db/client.ts src/db/migrations src/test/db-test.ts src/test/schema.integration.test.ts package.json package-lock.json
  git commit -m "feat: add standard data schema"
  ```

### Task 4: Add a Verified New York Standard-Data Seed

**Files:**
- Create: `src/db/seed/new-york-standard-data.ts`
- Create: `src/db/seed/build-new-york-data.ts`
- Create: `src/db/seed/seed.ts`
- Create: `data/new-york-standard-data.json` by running the checked-in normalization script against `AIRPALNE INFORMATION NEW YORK.xlsx`
- Test: `src/test/new-york-seed.integration.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `createDatabase(connectionString)` and `schema` exports from Tasks 2–3.
- Produces: `normalizeNewYorkWorkbook(sourcePath: string): NewYorkStandardData` and `loadNewYorkStandardData(sourcePath: string): NewYorkStandardData`.
- Produces: `seedNewYorkStandardData(database: DatabaseHandle, data: NewYorkStandardData): Promise<void>`.
- `NewYorkStandardData` is exactly `{ airport: { slug: 'new-york'; displayName: '纽约' }; levels: Array<{ levelNumber: number; starTargetRevenue: number }>; foodCategories: Array<{ name: string }>; foods: Array<{ name: string; category: string; displayOrder: number }>; souvenirs: Array<{ slot: 1 | 2; name: string; perItemRevenue: number; packageSize: 5; diamondPackagePrice: number }> }`.

- [ ] **Step 1: Write the failing normalization and seed integration test.**

  Create `src/test/new-york-seed.integration.test.ts` before creating any seed module:

  ```ts
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
    });
  });
  ```

- [ ] **Step 2: Run the focused seed test and confirm the red state.**

  Run:

  ```bash
  TEST_DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run test -- src/test/new-york-seed.integration.test.ts
  ```

  Expected: **FAIL** because `@/db/seed/new-york-standard-data` and `@/db/seed/seed` do not exist.

- [ ] **Step 3: Implement strict workbook normalization and JSON validation.**

  Install the Foundation-only workbook parser:

  ```bash
  npm install --save-dev xlsx
  ```

  Create `src/db/seed/new-york-standard-data.ts`:

  ```ts
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
  ```

- [ ] **Step 4: Generate canonical JSON, then implement idempotent complete-data insertion.**

  Create `src/db/seed/build-new-york-data.ts`:

  ```ts
  import { mkdirSync, writeFileSync } from 'node:fs';
  import path from 'node:path';
  import { normalizeNewYorkWorkbook } from './new-york-standard-data';

  const data = normalizeNewYorkWorkbook(path.join(process.cwd(), 'AIRPALNE INFORMATION NEW YORK.xlsx'));
  const outputPath = path.join(process.cwd(), 'data', 'new-york-standard-data.json');
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  ```

  Add this exact script to `package.json` and run it once before creating the seed module:

  ```json
  { "scripts": { "data:build-new-york": "tsx src/db/seed/build-new-york-data.ts" } }
  ```

  ```bash
  npm run data:build-new-york
  ```

  Expected: `data/new-york-standard-data.json` contains only the normalized New York data. It must be committed with the source code; do not add the workbook to the generated output or alter its source cells.

  Create `src/db/seed/seed.ts`:

  ```ts
  import 'dotenv/config';
  import path from 'node:path';
  import { and, eq } from 'drizzle-orm';
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

      for (const level of data.levels) {
        await tx
          .insert(levels)
          .values({
            airportId: newYork.id,
            levelType: 'standard',
            levelNumber: level.levelNumber,
            starTargetRevenue: level.starTargetRevenue,
          })
          .onConflictDoNothing({
            target: [levels.airportId, levels.levelType, levels.levelNumber],
          });
      }

      for (const category of data.foodCategories) {
        await tx.insert(foodCategories).values({ airportId: newYork.id, name: category.name, nameKey: category.name }).onConflictDoNothing({ target: [foodCategories.airportId, foodCategories.nameKey] });
      }

      for (const food of data.foods) {
        const [category] = await tx.select({ id: foodCategories.id }).from(foodCategories).where(and(eq(foodCategories.airportId, newYork.id), eq(foodCategories.nameKey, food.category)));
        if (!category) throw new Error(`Seed category not found: ${food.category}`);
        await tx.insert(foods).values({ airportId: newYork.id, categoryId: category.id, name: food.name, nameKey: food.name, displayOrder: food.displayOrder }).onConflictDoNothing({ target: [foods.airportId, foods.nameKey] });
      }

      for (const souvenir of data.souvenirs) {
        await tx.insert(souvenirs).values({ airportId: newYork.id, ...souvenir }).onConflictDoNothing({ target: [souvenirs.airportId, souvenirs.slot] });
      }
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

  void main();
  ```

  The seed uses only the checked-in JSON generated from the supplied workbook. It writes no player values and uses `onConflictDoNothing` for every standard-data unique key, so a later administrator change is never overwritten by a repeat seed.

- [ ] **Step 5: Run the focused seed test and verify the green state.**

  Run:

  ```bash
  TEST_DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run test -- src/test/new-york-seed.integration.test.ts
  ```

  Expected: **PASS**. It proves Excel normalization, all 50 exact New York levels, 4 categories, 12 foods in source order, 2 souvenirs, idempotent insertion, and preservation of an existing administrator-maintained Level value.

- [ ] **Step 6: Run the seed against a non-production database and inspect the result.**

  Run:

  ```bash
  DATABASE_URL='postgresql://user:password@host:5432/chc_local' npm run db:migrate
  DATABASE_URL='postgresql://user:password@host:5432/chc_local' npm run db:seed
  ```

  Then query:

  ```sql
  SELECT a.slug, l.level_type, count(*)
  FROM airports AS a
  JOIN levels AS l ON l.airport_id = a.id
  GROUP BY a.slug, l.level_type;
  ```

  Expected: one row, `new-york | standard | 50`; separate table counts are 4 `food_categories`, 12 `foods`, and 2 `souvenirs`.

- [ ] **Step 7: Run the final Foundation & Database verification set.**

  Run:

  ```bash
  TEST_DATABASE_URL='postgresql://user:password@host:5432/chc_test' npm run test
  npm run lint
  npm run build
  ```

  Expected: all tests **PASS**, including real-PostgreSQL connection/schema/seed tests; lint and production build exit 0. Confirm with `rg` that no application table or migration contains `revenue_delta`, `gold_cost`, `diamond_cost`, player draft fields, player result fields, or admin-auth tables.

- [ ] **Step 8: Commit the seed deliverable.**

  ```bash
  git add data/new-york-standard-data.json src/db/seed src/test/new-york-seed.integration.test.ts package.json package-lock.json
  git commit -m "feat: seed verified New York standard data"
  ```

## Self-Review

### TECH-SPEC Foundation & Database coverage

| TECH-SPEC requirement | Covered by |
| --- | --- |
| Next.js App Router, TypeScript, React, Tailwind, Vitest baseline | Task 1 |
| Server-only environment validation and database URL handling | Task 1 |
| Drizzle + PostgreSQL connection and migration runner | Task 2 |
| `airports`, `levels`, `food_categories`, `foods`, `souvenirs` | Task 3 |
| UUID PKs, timestamps, FKs, RESTRICT, uniqueness, CHECK constraints and indexes | Task 3 integration test + schema code |
| `airport_id` future extension and cross-airport food/category protection | Task 3 composite foreign-key test |
| Food `display_order`; no player income/cost columns | Task 3 schema and information-schema test |
| Souvenir slots 1/2 and immutable package size 5 | Task 3 schema and integration test |
| PostgreSQL `updated_at` trigger | Task 3 migration inspection |
| Migration execution and isolated test database safety | Tasks 2–3 |
| Canonical New York JSON and idempotent 50 Level, 4 category, 12 food and 2 souvenir seed | Task 4 |
| No persistence of player input, drafts or results | Global Constraints and Task 3 forbidden-column check |

### Placeholder scan

This plan contains no unfinished-marker text, unnamed interface, unspecified test assertion, or deferred implementation instruction. Drizzle-generated migration filenames are intentionally identified through the generated journal because Drizzle assigns the filename; the executor must commit the emitted SQL and metadata as one concrete migration artifact.

### Type and naming consistency

- Tables and Drizzle exports are consistently named `airports`, `levels`, `foodCategories`, `foods`, and `souvenirs`.
- Database columns consistently use snake case; TypeScript properties consistently use camel case, including `airportId`, `starTargetRevenue`, `displayOrder`, `packageSize`, and `diamondPackagePrice`.
- The connection factory is consistently `createDatabase`, its handle is `DatabaseHandle`, migration entry is `runMigrations`, and seed interfaces are `normalizeNewYorkWorkbook`, `loadNewYorkStandardData`, and `seedNewYorkStandardData`.
- `level_type` stores the technical value `standard`; the workbook source label `标准关卡` is mapped explicitly. The canonical JSON stores the validated technical structure only.

### Scope check

The plan does not create player pages beyond the generator's neutral root scaffold, administration pages, calculations, authentication, import/export, Server Actions, Figma UI components or production deployment configuration. Those boundaries remain unimplemented in this Foundation & Database plan.
