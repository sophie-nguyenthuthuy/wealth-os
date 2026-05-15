# Compliance map

Wealth OS operates across **four** legal jurisdictions on day one: Vietnam (home country, payouts) plus Japan, South Korea, and Taiwan (host countries, fund sources). Compliance is _not_ a milestone — it's a precondition for revenue.

> **This document is engineering-oriented.** It is not legal advice. Final positions are owned by the compliance and legal teams.

## Vietnam (home)

| Regime                                                           | Regulator                                      | Trigger                                              | Status                                                                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Payment intermediary license — e-wallet                          | SBV (State Bank of Vietnam)                    | We hold customer balances in VND                     | Required before launch. Capital floor: VND 50 B.                                                         |
| Payment intermediary license — collection / disbursement support | SBV                                            | We disburse remittance to VN bank accounts / wallets | Required. Usually bundled with e-wallet.                                                                 |
| KYC standard                                                     | Decree 88/2019/ND-CP, Circular 09/2020/TT-NHNN | All customers                                        | Two-tier KYC matches our `TIER_1` / `TIER_2` model.                                                      |
| Insurance distribution                                           | MoF / ISA                                      | Selling underwritten policies                        | Either become a licensed agent or pure-play tied-agent of one underwriter. Day-one: tied to one carrier. |
| Fund distribution                                                | SSC (State Securities Commission)              | Selling mutual fund units                            | Securities distribution license, OR partner with a licensed distributor (fund house's own DSP).          |
| AML / CFT                                                        | Law on AML 14/2022/QH15                        | Money movement                                       | Transaction monitoring, sanctions screening, STR/CTR reporting.                                          |

## Japan (host)

| Regime                                                            | Regulator  | Trigger                                                 |
| ----------------------------------------------------------------- | ---------- | ------------------------------------------------------- |
| Funds Transfer Service Provider, Type II (Shikinketsusai Gyousha) | FSA / KLFB | Outbound remittance ≤ ¥1,000,000 per transfer           |
| Crypto-asset exchange                                             | FSA        | We accept crypto (not on roadmap — explicitly excluded) |
| Personal Information Protection Act (APPI)                        | PPC        | PII of JP-resident workers                              |

Day-one position: ride on a licensed partner (e.g., SBI Remit Vietnam, Seven Bank International Money Transfer). Wealth OS is the _interface_, the partner is the _licensed entity_. The partnership contract defines who is on the regulator's hook for which obligation.

## South Korea (host)

| Regime                                     | Regulator | Trigger                                                                  |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------ |
| Small-Sum Overseas Remittance Business     | FSC / FSS | Outbound remittance up to USD 5,000/transfer, USD 50,000/year per person |
| PIPA — Personal Information Protection Act | PIPC      | PII of KR-resident workers                                               |
| Foreign Exchange Transactions Act          | MoF       | Outbound FX reporting thresholds                                         |

EPS (Employment Permit System) Vietnamese worker IDs are issued by HRD Korea. We partner directly with HRD Korea / EPS Vietnam Center for onboarding (this is part of the moat).

## Taiwan (host)

| Regime                             | Regulator | Trigger                    |
| ---------------------------------- | --------- | -------------------------- |
| Electronic Payment Institution Act | FSC       | Holding TWD balances       |
| Money laundering control act       | FSC       | All money movement         |
| Personal Data Protection Act       | NDC       | PII of TW-resident workers |

CLA (Council of Labour Affairs) is the gateway for Vietnamese laborer onboarding.

## Data residency

| Data class                 | Required residency                      | Where we store                               |
| -------------------------- | --------------------------------------- | -------------------------------------------- |
| Vietnamese worker PII      | VN (Decree 53/2022 + Cybersecurity Law) | VN region (planned: VNG Cloud / AWS Vietnam) |
| Host-country PII           | Host country (APPI, PIPA, PDPA)         | Per-country tenant store (planned)           |
| Transaction logs (non-PII) | No restriction                          | Primary region                               |
| Backups                    | Same constraints as primary             | Per-region object storage                    |

This forces a **regional sharding** topology by Q2 2027. Until then we operate in single-region "preview" mode under written customer consent + a clear path to data localization.

## AML / sanctions

- **OFAC, EU, UN consolidated lists** — screen on registration and before every outbound transfer.
- **PEP screening** — third-party data feed (planned: ComplyAdvantage or Refinitiv).
- **Transaction monitoring rules** — initial ruleset (planned):
  - Single transfer ≥ USD 10,000 equivalent
  - Daily aggregate ≥ USD 15,000 equivalent
  - Velocity: > 5 transfers in 24h
  - Round-tripping: same source/dest pair within 7 days
  - Geography mismatch: host country in worker profile ≠ network IP country

All hits create an `audit_events` row with `action=aml.alert` and surface to the admin console.

## What this scaffold ships today

- ✅ Two-tier KYC schema (`kyc_records.level` ∈ TIER_0/TIER_1/TIER_2).
- ✅ Append-only audit ledger covering auth, money movement, policy changes.
- ✅ Transaction limits structure (`KYC_TIER_LIMITS_VND` in shared constants).
- ✅ FX snapshot persistence on every quote — full rate provenance.
- ❌ KYC provider integration (Onfido / SumSub / Trulioo) — service stub.
- ❌ Sanctions / PEP screening — placeholder.
- ❌ Per-region data sharding — single-region scaffold.

These gaps are the launch blockers tracked in [ROADMAP.md](ROADMAP.md).
