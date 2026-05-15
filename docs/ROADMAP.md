# Roadmap

A pragmatic, dated plan. Adjust as we learn.

## Phase 0 — Scaffold (Now)

What's in this repo today:

- Monorepo with API, Prisma, shared package
- Full domain schema for remittance, savings, investments, insurance
- Auth (JWT + rotating refresh)
- Quote/confirm flow for remittance with FX snapshot
- Health, audit, notifications stubs
- CI: lint, typecheck, test, build, Docker
- Docker Compose for local Postgres + Redis

## Phase 1 — Closed alpha (Q3 2026)

Goal: ~50 workers from one Japanese union testing remittance + savings end-to-end with real money via a licensed partner.

- KYC provider integration (target: SumSub for global reach)
- SBI Remit partner adapter — production submit + reconcile workers
- FX provider integration (target: OpenExchangeRates or Wise public rates)
- Mobile app v0 (React Native, iOS + Android, Vietnamese only)
- Admin console v0 (Next.js): KYC review queue, transfer status, audit log search
- Sanctions screening (ComplyAdvantage)
- Pen test + threat model review

## Phase 2 — Open beta JP corridor (Q4 2026 – Q1 2027)

- Auto-savings rules (PAYROLL_DEPOSIT trigger) running in production
- Investments: 1 fund partner (Dragon Capital VFM VF1), NAV daily ingestion + order fills
- Insurance: 1 product (Bao Viet family health basic) with monthly premium debit job
- Push notifications (FCM), SMS via Zalo Cloud (cheaper than Twilio in VN)
- VN tax doc generation (PIT report for investment gains)

## Phase 3 — Korea + Taiwan (Q2 2027)

- KR corridor with GME Remit / Hanpass partnership
- TW corridor with EZremit partnership
- EPS Vietnam Center + Taiwan CLA partnership signed
- Per-region data sharding (VN data in VN, JP data in JP, etc.)
- Native Korean and Traditional Chinese UI

## Phase 4 — Own the rails (2028+)

- Apply for SBV payment intermediary license (e-wallet + collection support)
- Apply for FSA Type II FTSP in Japan to de-risk partner dependency
- Apply for FSC Small-Sum Overseas Remittance Business in Korea
- Insurance: own MGA license, broaden product set
- Investment robo-advisor (model portfolios) — requires SSC distribution license

## Backlog (not yet scheduled)

- Card issuance (host country) for spending the JPY/KRW balance directly
- Group savings (rotating credit "hụi" digital primitive)
- Repatriation planning calculator (target VND savings by month X)
- Family member companion app (VN side, receive-only)
- Open Banking VN integration once SBV rules finalize
