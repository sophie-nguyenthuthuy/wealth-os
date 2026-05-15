# Architecture

## System overview

```
┌──────────────────┐   HTTPS    ┌──────────────────────────────────────────┐
│  Mobile (RN)     │ ─────────► │              API gateway (Fastify)        │
│  Admin (Next.js) │            │           apps/api  — NestJS 10           │
└──────────────────┘            │                                           │
                                │  ┌─────────┬─────────┬────────┬────────┐ │
                                │  │  auth   │ users / │ remit- │ savings│ │
                                │  │         │ workers │ tance  │        │ │
                                │  ├─────────┼─────────┼────────┼────────┤ │
                                │  │ invest- │ insur-  │   fx   │ notif- │ │
                                │  │ ments   │ ance    │        │ ications│ │
                                │  └────┬────┴────┬────┴────┬───┴───┬────┘ │
                                └───────┼─────────┼─────────┼───────┼──────┘
                                        ▼         ▼         ▼       ▼
                              ┌────────────┐ ┌────────────┐ ┌───────────────┐
                              │ PostgreSQL │ │   Redis    │ │ Partner APIs  │
                              │  (Prisma)  │ │ (BullMQ +  │ │ SBI / GME /   │
                              │            │ │  rate cache)│ │ EZremit / Wise│
                              └────────────┘ └────────────┘ └───────────────┘
                                                                    │
                                                                    ▼
                                                            ┌───────────────┐
                                                            │ FX providers, │
                                                            │ underwriters, │
                                                            │ fund houses   │
                                                            └───────────────┘
```

## Module boundaries

Each NestJS module owns one bounded context and exposes a thin service interface:

| Module          | Responsibility                                                | Owns                                                       |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| `auth`          | Registration, login, refresh-token rotation, password storage | `users`, `refresh_tokens` (write), `audit_events` (write)  |
| `users`         | Read-only "me" surface for the app                            | `users` (read)                                             |
| `workers`       | Worker-specific profile (visa, employer, union)               | `worker_profiles`, `unions`                                |
| `remittance`    | Quoting, authorization, settlement orchestration              | `remittances`, `remittance_corridors`, ledger writes       |
| `savings`       | Multi-currency wallets, auto-savings rules                    | `wallets`, `auto_savings_rules`, ledger writes             |
| `investments`   | Fund catalog, NAVs, buy/sell orders, holdings                 | `funds`, `fund_navs`, `investment_orders`, `fund_holdings` |
| `insurance`     | Product catalog, policy lifecycle                             | `insurance_products`, `insurance_policies`                 |
| `fx`            | FX rate ingestion, quote pricing                              | `fx_rate_snapshots`                                        |
| `notifications` | Outbound push / SMS / email queue                             | `notifications`                                            |
| `audit`         | Append-only audit ledger                                      | `audit_events`                                             |

Cross-module dependencies are explicit and one-directional. `remittance` may depend on `fx`. Nothing depends on `auth` at the service level — auth is enforced by the global `JwtAuthGuard`.

## Money: double-entry ledger

`wallets.balance` is a materialized view of `ledger_entries`. Every credit / debit pair runs in the same Prisma transaction, so a partial post is impossible. The ledger is append-only — reversals are explicit `ADJUSTMENT` entries with a back-reference correlationId, never destructive updates.

All amounts are `Decimal(20, 4)` and carry a Currency enum. Cross-currency moves must reference an `FxRateSnapshot.id` so the rate is auditable post-hoc.

## Async work

BullMQ on Redis handles:

- **remittance.submit** — push authorized transfers to the partner API.
- **remittance.reconcile** — poll partner status until `SETTLED` or `FAILED`.
- **fx.refresh** — pull mid rates from the upstream provider every N seconds.
- **investments.nav-import** — daily fund NAV ingestion.
- **investments.fill** — apply NAV to open orders, post ledger entries, update holdings.
- **insurance.premium** — monthly premium debit per active policy.
- **notifications.dispatch** — fan out PENDING notifications to providers.

Jobs are idempotent and use the partner-side reference (`partnerRef`) or a derived hash as the BullMQ job ID to dedupe.

## Auth flow

1. `POST /v1/auth/register` — create user + worker profile + first audit event. Returns access + refresh tokens.
2. `POST /v1/auth/login` — credential check, audit "auth.login", returns tokens.
3. Access tokens are short-lived (15 min default). Refresh tokens are long-lived (30 days), opaque (random 48-byte), and stored as SHA-256 hashes.
4. `POST /v1/auth/refresh` — rotates: revokes the old refresh row, issues a new pair. Re-use of a revoked refresh signals theft → optional family revocation (planned).

## Observability

- **Logs** — pino, JSON, with `correlationId` injected from `x-correlation-id` request header (auto-generated UUID if absent).
- **Errors** — caught by `AllExceptionsFilter`, mapped to a stable `{ error: { code, message, correlationId } }` shape. Prisma error codes (P2002, P2025, P2003) get specific HTTP statuses.
- **Health** — `GET /v1/health` (full check incl. DB), `GET /v1/health/liveness` (process-only, for k8s).
- **Metrics** — planned: OTEL exporter to whatever backend the platform team picks.

## Failure modes we explicitly handle

- **Stale FX quote on confirm** — quote rows carry `quoteExpiresAt`; confirming after expiry returns 409.
- **Partner submission failure** — remittance moves to `FAILED`; ledger is reversed by an `ADJUSTMENT` entry in the worker job.
- **Refresh token replay** — old tokens are revoked atomically with new-token issuance.
- **Insufficient wallet balance** — surfaced as `BAD_REQUEST` before any partner call.

## What's not yet in this scaffold

- KYC provider integration (Onfido / SumSub / Trulioo) — stubs only.
- MFA (TOTP + SMS OTP).
- Mobile app & admin console (placeholder folders).
- Real partner adapters (SBI Remit, GME, EZremit) — only the corridor table is seeded.
- Multi-region deployment topology.

These are tracked in [ROADMAP.md](ROADMAP.md).
