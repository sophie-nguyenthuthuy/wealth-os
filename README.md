# Wealth OS

> Financial OS for the 650,000 Vietnamese migrant workers in Japan, South Korea, and Taiwan.

Wealth OS is a multi-currency neobank-style platform that bundles four products into a single mobile-first experience:

1. **Low-fee remittance** — JPY/KRW/TWD → VND with transparent FX and sub-1% fees.
2. **Auto-savings** — split-paycheck rules into JPY/KRW + VND sub-wallets.
3. **Investments** — fractional units of SBV-licensed Vietnamese mutual funds (VFM, Dragon Capital, VinaCapital).
4. **Family health insurance** — micro-policies underwritten in Vietnam, premium paid from worker's host-country wallet.

The economic insight: Vietnamese migrant workers remit ~**$4 B/year** but lose 30–50% of lifetime savings to predatory brokers, high-fee banks, and zero financial planning. Wealth OS captures the entire stack from payday to retirement.

The defensibility insight: distribution is gated by the Japanese Technical Intern Training Program (JITCO/OTIT), Korean EPS, and Taiwan CLA labor unions. We onboard through union partnerships, not paid ads.

---

## Repository layout

```
wealth-os/
├── apps/
│   ├── api/          NestJS backend (TypeScript)
│   ├── mobile/       React Native app (planned)
│   └── admin/        Next.js ops console (planned)
├── packages/
│   ├── database/     Prisma schema + migrations + seed
│   └── shared/       Cross-app types, money utilities, constants
├── docs/             Architecture, API, deployment, compliance
├── scripts/          One-off dev/ops scripts
└── docker-compose.yml
```

The API is the only fully implemented app in this scaffold. Mobile and admin are scoped placeholders.

---

## Quick start

Prerequisites: Node.js 20.x, pnpm 9.x, Docker.

```bash
# 1. Install
pnpm install

# 2. Boot Postgres + Redis
docker compose up -d postgres redis

# 3. Apply schema & seed
pnpm --filter @wealth-os/database prisma:migrate:dev
pnpm --filter @wealth-os/database prisma:seed

# 4. Start the API
pnpm --filter @wealth-os/api dev
```

API will be live at `http://localhost:3000` with Swagger UI at `/docs`.

---

## Tech stack

| Layer         | Choice                              | Why                                     |
| ------------- | ----------------------------------- | --------------------------------------- |
| Runtime       | Node.js 20 LTS                      | Long-term support through 2026          |
| Language      | TypeScript 5.x (strict)             | Type safety at finance scale            |
| API framework | NestJS 10                           | Module isolation, DI, mature ecosystem  |
| ORM           | Prisma 5                            | Type-safe migrations, Decimal for money |
| DB            | PostgreSQL 16                       | ACID + JSONB + partitioning for ledger  |
| Cache / queue | Redis 7 + BullMQ                    | Async settlement, FX polling, payouts   |
| Auth          | JWT access + rotating refresh       | Mobile-first, revocable                 |
| Logging       | Pino                                | Structured JSON, low overhead           |
| Validation    | class-validator + class-transformer | Native NestJS pattern                   |
| Tests         | Jest + Supertest                    | Unit + e2e                              |
| Build         | Turborepo + pnpm workspaces         | Monorepo caching                        |
| Container     | Multi-stage Docker                  | Distroless final image                  |
| CI            | GitHub Actions                      | Lint, test, build, scan                 |

---

## Domain modules (apps/api)

- **auth** — registration, login, refresh, password reset, MFA (planned).
- **users / workers** — base account + extended worker profile (host country, visa, employer, union linkage).
- **remittance** — multi-corridor transfers (JP→VN, KR→VN, TW→VN), FX-quoted, queued for settlement.
- **savings** — multi-currency wallets, auto-savings rules ("save 30% of every payroll deposit").
- **investments** — fund catalog + buy/sell orders + holdings, priced against daily NAV.
- **insurance** — family health policies, beneficiaries, premium debits, claims.
- **fx** — FX rate ingestion + spreads + audit trail.
- **notifications** — push (FCM), SMS (Zalo/Twilio), email.
- **audit** — append-only ledger of every state-changing action.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture.

---

## Compliance posture

This product touches three regulators on day one. See [docs/COMPLIANCE.md](docs/COMPLIANCE.md) for the regulatory map. Short version:

- **Vietnam (SBV)** — payment intermediary license, e-wallet license, KYC per Decree 88/2019.
- **Japan (FSA)** — Funds Transfer Service Provider (Type II, ≤ ¥1M/transaction) for outbound corridor.
- **Korea (FSC)** — Small-Sum Overseas Remittance Business registration.

We do **not** custody host-country funds directly until licensed. Until then, remittance flows through a licensed partner (e.g., Wise Business, SBI Remit) with us as the front-end + compliance + customer-relationship layer.

---

## License

Proprietary. All rights reserved.
