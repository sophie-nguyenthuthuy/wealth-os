# API reference (summary)

All endpoints are prefixed with `/v1`. JSON request and response bodies. Bearer auth via `Authorization: Bearer <accessToken>` unless marked **public**.

Full machine-readable spec is served at `/docs` (Swagger UI) in non-production environments.

## Response envelope

```json
{
  "data": { ... },
  "meta": {
    "correlationId": "0a8c…",
    "timestamp": "2026-05-15T08:21:33.044Z"
  }
}
```

Errors:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials",
    "correlationId": "0a8c…"
  }
}
```

## Auth

| Method | Path             | Auth   | Purpose                         |
| ------ | ---------------- | ------ | ------------------------------- |
| POST   | `/auth/register` | public | Create worker account + profile |
| POST   | `/auth/login`    | public | Exchange credentials for tokens |
| POST   | `/auth/refresh`  | public | Rotate access + refresh tokens  |
| POST   | `/auth/logout`   | bearer | Revoke a refresh token          |

## Users / Workers

| Method | Path                       | Purpose                                              |
| ------ | -------------------------- | ---------------------------------------------------- |
| GET    | `/users/me`                | Current user + worker profile + recent KYC           |
| GET    | `/workers/me`              | Worker-only view                                     |
| PATCH  | `/workers/me`              | Update employer, union, visa expiry, expected return |
| GET    | `/workers/unions` (public) | List partner unions                                  |

## Remittance

| Method | Path                  | Purpose                                             |
| ------ | --------------------- | --------------------------------------------------- |
| POST   | `/remittance/quote`   | Time-bound FX quote                                 |
| POST   | `/remittance/confirm` | Authorize + debit wallet + queue partner submission |
| GET    | `/remittance`         | Paginated list                                      |
| GET    | `/remittance/:id`     | Detail                                              |

## Savings

| Method | Path                 | Purpose                   |
| ------ | -------------------- | ------------------------- |
| GET    | `/savings/wallets`   | All my wallets + balances |
| GET    | `/savings/rules`     | My auto-savings rules     |
| POST   | `/savings/rules`     | Create rule               |
| DELETE | `/savings/rules/:id` | Deactivate rule           |

## Investments

| Method | Path                              | Purpose                      |
| ------ | --------------------------------- | ---------------------------- |
| GET    | `/investments/funds` (public)     | Active funds with latest NAV |
| GET    | `/investments/funds/:id` (public) | Fund detail + 30 days NAV    |
| GET    | `/investments/holdings`           | My holdings                  |
| POST   | `/investments/orders`             | Place BUY or SELL order      |
| GET    | `/investments/orders`             | My orders (last 100)         |

## Insurance

| Method | Path                           | Purpose                |
| ------ | ------------------------------ | ---------------------- |
| GET    | `/insurance/products` (public) | Catalog                |
| POST   | `/insurance/quote`             | Create QUOTED policy   |
| POST   | `/insurance/activate`          | Activate quoted policy |
| GET    | `/insurance/policies`          | My policies            |

## FX

| Method | Path                                   | Purpose                |
| ------ | -------------------------------------- | ---------------------- |
| GET    | `/fx/rate?base=JPY&quote=VND` (public) | Latest indicative rate |

## Notifications

| Method | Path             | Purpose                  |
| ------ | ---------------- | ------------------------ |
| GET    | `/notifications` | My last 50 notifications |

## Health

| Method | Path                        | Purpose                 |
| ------ | --------------------------- | ----------------------- |
| GET    | `/health` (public)          | Full check (DB + Redis) |
| GET    | `/health/liveness` (public) | Process-only check      |
