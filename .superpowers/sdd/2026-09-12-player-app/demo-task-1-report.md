# Demo Task 1 Report

## Status

Implemented the minimal player-calculation boundary: a server-only injected Drizzle repository, lazy production runtime wrapper, raw-input parser, authority-adapting service, injected Action boundary, and production Server Action wrapper. The calculation engine and database schema/seed/canonical data were not changed.

## Changed files

- `src/server/repositories/player-standard-data.repository.ts`
- `src/server/repositories/player-standard-data.runtime.ts`
- `src/lib/validation/player-calculator.ts`
- `src/server/services/calculate-player-plan.ts`
- `src/server/actions/calculate-player-plan.boundary.ts`
- `src/server/actions/calculate-player-plan.ts`
- `src/test/unit/player-standard-data.repository.test.ts`
- `src/test/unit/player-calculator-validation.test.ts`
- `src/test/integration/player-standard-data.repository.integration.test.ts`
- `src/test/integration/player-calculator.boundary.integration.test.ts`

## TDD evidence

### RED

Before production modules existed, the focused test run failed as expected:

```text
npm run test -- src/test/unit/player-standard-data.repository.test.ts src/test/unit/player-calculator-validation.test.ts src/test/integration/player-calculator.boundary.integration.test.ts
```

It reported `ERR_MODULE_NOT_FOUND` for `player-standard-data.repository`, `player-calculator`, and `calculate-player-plan.boundary`. The subsequent new repository integration test also failed before execution because `player-standard-data.repository` did not exist.

### GREEN

After implementation, the focused unit run passed:

```text
npm run test -- src/test/unit/player-standard-data.repository.test.ts src/test/unit/player-calculator-validation.test.ts
Test Files  2 passed (2)
Tests  10 passed (10)
```

The complete non-integration test portion of the final suite passed: 70 tests in 8 files. Lint completed successfully with `npm run lint`.

## Final verification

- `git diff --check`: passed.
- `npm run lint`: passed.
- `npm run test`: 70 tests passed; five integration suites could not start because `TEST_DATABASE_URL` is unset. This affects pre-existing integration suites as well as the two added suites.
- `npm exec tsc -- --noEmit`: blocked only by pre-existing `src/app/layout.tsx(9,50): Cannot find name 'LayoutProps'`.

## Self-review

- Repository imports `server-only`, accepts an injected caller-owned database, does not parse production environment values, and never closes the injected handle.
- Runtime wrapper lazily parses `DATABASE_URL` only when called and owns connection cleanup.
- Calculator reads are New York-scoped, ordered, and require exactly 50 sequential standard levels plus slots 1 and 2; an empty food catalog remains valid.
- The parser uses anchored decimal strings and `Number.isSafeInteger`, maps blank budgets to `null`, preserves finite zero, and strips forged root/nested authority fields.
- The service resolves selected IDs from fresh authority and passes resolved level, food, category, and souvenir fields with only player-owned numeric inputs to exactly one engine invocation.
- No schema, migrations, seed data, canonical JSON, or engine public contracts changed.

## Commit

`feat: add player calculation data boundary`

## Concerns

Integration tests still need a dedicated migrated disposable PostgreSQL URL through `TEST_DATABASE_URL`. The repository documents this as an intentional safety requirement. The worktree also has the unrelated unresolved `LayoutProps` TypeScript error in `src/app/layout.tsx`.
