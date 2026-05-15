# Contributing

## Setup

```bash
corepack enable && corepack prepare pnpm@9.12.0 --activate
./scripts/bootstrap.sh
```

This installs dependencies, starts Postgres + Redis, applies migrations, and seeds reference data.

## Day-to-day

```bash
# Run the API in watch mode
pnpm --filter @wealth-os/api dev

# Open Prisma studio
pnpm --filter @wealth-os/database prisma:studio

# Run the test suite for one package
pnpm --filter @wealth-os/shared test

# Run everything CI runs
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Code style

- TypeScript strict mode, no `any` (warned).
- One concept per module. Avoid cross-module imports beyond the explicit allow-list in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Money values: never `number`. Use the `Money` class from `@wealth-os/shared/money` or Prisma `Decimal`.
- Times: always UTC, ISO 8601 on the wire, `DateTime` (timestamptz) in Postgres.
- Database access: always through `PrismaService`, never raw SQL except for migrations.

## Commits & PRs

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Keep PRs small and focused. < 400 net lines is the soft cap.
- Every PR runs lint, typecheck, test, build. All must pass.
- Compliance-sensitive paths (`auth/`, `remittance/`, `insurance/`, schema) require an additional reviewer from `@wealth-os/compliance` per CODEOWNERS.

## Adding a migration

```bash
pnpm --filter @wealth-os/database prisma:migrate:dev -- --name <short-snake-case-name>
```

Review the generated SQL by hand. Migrations must be:

- Backwards compatible with the currently deployed API version.
- Idempotent where reasonable.
- Free of locking statements that would block traffic for > 1s on a large table.

## Local test data

`packages/database/prisma/seed.ts` populates unions, corridors, funds, and insurance products. Run it after every `prisma:migrate:reset`:

```bash
pnpm --filter @wealth-os/database prisma:seed
```
