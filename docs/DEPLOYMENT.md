# Deployment

## Environments

| Env         | Purpose                            | Data                      | Audience                 |
| ----------- | ---------------------------------- | ------------------------- | ------------------------ |
| **local**   | Developer laptops                  | Docker volumes, synthetic | Engineers                |
| **dev**     | Shared sandbox, breakable          | Synthetic, reset weekly   | Engineering + design     |
| **staging** | Pre-release, mirrors prod topology | Anonymized snapshot       | QA, partners, regulators |
| **prod**    | Live customer traffic              | Real                      | Customers                |

Each environment maps to a separate AWS account (or VPC) and a separate Postgres instance. No environment ever talks to another environment's data.

## Topology (target)

```
            ┌────────────────────────────────────────────────────────┐
 Cloudflare │                       CDN / WAF                          │
            └─────────────────────────┬──────────────────────────────┘
                                      ▼
                          ┌────────────────────────┐
                          │  ALB  /  API gateway   │
                          └───────────┬────────────┘
                                      ▼
            ┌─────────────────────────────────────────────────────┐
            │   ECS Fargate (api) — N replicas, auto-scaled       │
            └────┬─────────────────────────────────┬──────────────┘
                 ▼                                 ▼
   ┌──────────────────────┐            ┌────────────────────────┐
   │  RDS Postgres 16     │            │ ElastiCache Redis 7    │
   │  Multi-AZ, encrypted │            │  cluster-mode-enabled  │
   └──────────────────────┘            └────────────────────────┘
                 │                                 │
                 ▼                                 ▼
   ┌──────────────────────┐            ┌────────────────────────┐
   │  S3 — backups, logs  │            │ Secrets Manager        │
   └──────────────────────┘            └────────────────────────┘
```

Worker queues run on the same ECS service in a separate task definition (no public ingress).

## Container build

`apps/api/Dockerfile` is a 3-stage multi-stage build:

1. **deps** — install pnpm dependencies into a separate layer.
2. **builder** — `prisma generate`, build shared package, build API.
3. **runner** — copy `dist/`, `node_modules`, and the Prisma client. Runs as the non-root `wealthos:1001` user. `tini` is PID 1.

Final image size target: < 250 MB. Healthcheck hits `/v1/health` every 30s.

## Migrations

We use Prisma migrations, applied with `prisma migrate deploy` in a one-shot job that runs _before_ a new API task is allowed to take traffic.

- All migrations must be **backwards compatible** with the previous deployed API version. Two-step migrations:
  1. ship code that tolerates both shapes
  2. apply schema change
  3. ship code that requires the new shape
- Destructive migrations (DROP COLUMN, TYPE change) require explicit approval in PR review.
- Migrations run with a 30s statement timeout in prod; long migrations must be hand-batched.

## Secrets

All secrets in **AWS Secrets Manager**, referenced by name in the task definition. **Never** in `.env` files committed to the repo. The CI workflow uses a least-privilege IAM role assumed via OIDC.

Mandatory secrets (production):

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (rotated annually)
- `REMITTANCE_PARTNER_API_KEY`
- `FX_PROVIDER_API_KEY`
- `FCM_SERVER_KEY`, `TWILIO_*`
- `SENTRY_DSN`

## Rollback

A rollback is `aws ecs update-service` pointing at the previous task-definition revision. Database migrations are forward-compatible by policy, so a code rollback does not require a schema rollback.

If a migration must be reverted, do not run `prisma migrate down` blindly — create a new compensating migration that restores the previous schema, and ship it through the normal pipeline.

## SLOs (target)

| Surface                  | Latency p95                        | Availability |
| ------------------------ | ---------------------------------- | ------------ |
| `/v1/auth/*`             | < 300 ms                           | 99.9%        |
| `/v1/remittance/quote`   | < 500 ms                           | 99.9%        |
| `/v1/remittance/confirm` | < 800 ms (includes DB transaction) | 99.95%       |
| `/v1/health`             | < 50 ms                            | 99.99%       |

Error budget burn alerts and oncall rotation: tracked outside this repo.
