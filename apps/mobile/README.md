# @wealth-os/mobile (planned)

React Native (Expo) application for end users.

## Why React Native

- Vietnamese workers in JP/KR/TW are 90%+ Android. RN gives us iOS as a near-free byproduct.
- Hot OTA updates via Expo EAS Update — critical for fixing field bugs without an app-store review cycle when a worker is mid-remittance.
- One codebase shared with the admin team's internal RN tooling (planned).

## Planned structure

```
apps/mobile/
├── app/                  Expo Router routes
│   ├── (auth)/login.tsx
│   ├── (tabs)/index.tsx        Wallet home
│   ├── (tabs)/remit.tsx        Send money
│   ├── (tabs)/invest.tsx
│   ├── (tabs)/insurance.tsx
│   └── (tabs)/me.tsx
├── components/
├── lib/
│   ├── api/                    OpenAPI-generated client from /docs
│   ├── i18n/                   vi-VN, ja-JP, ko-KR, zh-TW, en-US
│   ├── money/                  re-exported from @wealth-os/shared
│   └── secure-storage/         Keychain / Keystore wrappers for tokens
└── app.json
```

## Not yet scaffolded

Empty placeholder. To be initialized with `pnpm dlx create-expo-app` once the API contracts stabilize (target: end of Phase 1).
