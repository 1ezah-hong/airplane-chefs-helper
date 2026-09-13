# Demo Task 2 Report — Mobile New York entry and calculator form

## Changed files

- `src/app/page.tsx` — replaced the starter page with the minimal mobile-first New York entry and visibly unavailable cities.
- `src/app/new-york/page.tsx` — server route that reads `CalculatorData` through `withPlayerStandardDataRepository` and passes serializable data plus the real `calculatePlan` Server Action to the client form.
- `src/app/new-york/calculator-form.tsx` — one-column controlled raw-request form, conditional food and souvenir inputs, action errors, and pending-submit protection. The client has no runtime repository, database, `CalculationInput`, or calculation-engine import.
- `src/app/new-york/calculator-form.test.tsx` — browser-side checks for conditional food inputs, enabled-souvenir inventory validation feedback, retained blank inventory, and duplicate-submit protection.
- `vitest.config.ts`, `package.json`, `package-lock.json` — minimal jsdom and Testing Library test support for `.test.tsx` files.

## RED / GREEN evidence

- RED: `npm test -- src/app/new-york/calculator-form.test.tsx` initially failed because the new `./calculator-form` module did not exist.
- GREEN: `npm test -- src/app/new-york/calculator-form.test.tsx src/test/unit/player-calculator-validation.test.ts` passed: 2 files, 12 tests.

## Verification

- `npm run lint` passed.
- `npx next typegen && npx tsc --noEmit` passed. The initial standalone TypeScript check exposed the repository's generated `LayoutProps` prerequisite; Next's documented route type generation resolved it, and no task-introduced type errors remain.
- `git diff --check` passed.

## Self-review

- New York is the only active homepage destination and routes to `/new-york`; other cities are marked `暂未开放`.
- The server page is the only new code that reads the repository. The client submits only browser strings plus the trusted data IDs and does not expose editable target or authority values.
- The form uses the server-provided level target and all server-provided food/souvenir rows. Food numeric fields render only for selected food; souvenir inventory renders only when enabled. Empty budgets remain blank strings.
- Submission locks while pending, retains inputs on all returned or caught errors, and renders validation field errors plus action-level errors. No result storage/page, carousel, dialog, desktop breakpoint, schema, migration, seed, canonical JSON, or engine-contract work was added.

## Commit

- `feat: add New York player calculator form`

## Concerns

- Vitest emits the existing Vite `configLoader: 'native'` future-compatibility warning because `vitest.config.ts` uses ESM syntax in a CommonJS package context. It does not affect the passing checks and is outside this task's scope.
