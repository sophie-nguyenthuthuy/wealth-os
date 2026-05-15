# @wealth-os/admin (planned)

Internal ops console for KYC review, transfer monitoring, fraud triage, and compliance reporting.

## Planned structure

```
apps/admin/
├── app/                  Next.js 14 app router
│   ├── (auth)/login
│   ├── kyc/queue
│   ├── kyc/[id]
│   ├── remittance/[id]
│   ├── audit
│   └── reports
├── components/
└── lib/
    └── api/              same generated client as mobile
```

## Access model

Admin users are *not* in the `users` table. A separate `admin_users` table with role-based access controls (planned: KYC_REVIEWER, COMPLIANCE_OFFICER, OPS, SUPER_ADMIN) keeps audit trails clean and prevents privilege confusion.

## Not yet scaffolded

Empty placeholder. Initialize with `pnpm dlx create-next-app` when the Phase 1 KYC workflow is finalized.
