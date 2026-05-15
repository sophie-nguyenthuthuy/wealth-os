# Security policy

## Reporting a vulnerability

Email **security@wealth-os.example** with details. Do **not** open a public GitHub issue. We acknowledge within 2 business days and aim to triage within 5.

In scope: this repository, the deployed API, the mobile app, and the admin console.

Out of scope: third-party services we integrate with (report directly to that vendor), spam / brute-force without proof of impact, and accepted-risk items listed in our threat model.

## Coordinated disclosure

We follow a 90-day coordinated disclosure window. If a fix is impractical inside that window we will negotiate an extension; we will not pressure reporters to withhold beyond 180 days total.

## Production safety practices in this repo

- **Secrets** — never committed. Validated at boot (`validateEnv`).
- **Passwords** — bcrypt, configurable rounds (default 12).
- **Refresh tokens** — random 48-byte secrets stored as SHA-256 hashes, rotated on every use.
- **PII redaction** — pino redacts `authorization`, `password`, `refreshToken` in logs.
- **SQL injection** — all DB access via Prisma parameterised queries.
- **CSRF** — JWT bearer auth, no cookies, no CSRF surface.
- **Helmet** — security headers enabled at the Fastify level.
- **Rate limiting** — global throttler (configurable per env).
- **Dependency scanning** — Dependabot weekly + `pnpm audit` in CI.

## Out-of-the-box gaps (tracked)

- MFA (TOTP + SMS OTP).
- WebAuthn / passkeys for the mobile app.
- Per-IP brute-force lockout on `/auth/login`.
- mTLS to internal services (planned with service mesh).
