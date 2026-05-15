export const SUPPORTED_HOST_COUNTRIES = ['JP', 'KR', 'TW'] as const;
export type HostCountry = (typeof SUPPORTED_HOST_COUNTRIES)[number];

export const HOME_COUNTRY = 'VN' as const;

export const SUPPORTED_CURRENCIES = ['VND', 'JPY', 'KRW', 'TWD', 'USD'] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

// ISO 4217 minor unit exponents. JPY and KRW are zero-decimal currencies.
export const CURRENCY_EXPONENT: Record<CurrencyCode, number> = {
  VND: 0,
  JPY: 0,
  KRW: 0,
  TWD: 2,
  USD: 2,
};

export const REMITTANCE_QUOTE_TTL_SECONDS = 90;
export const MAX_REFRESH_TOKEN_PER_USER = 10;
export const BCRYPT_MIN_ROUNDS = 10;

export const KYC_TIER_LIMITS_VND: Record<'TIER_0' | 'TIER_1' | 'TIER_2', { dailyOut: number; monthlyOut: number }> = {
  TIER_0: { dailyOut: 0, monthlyOut: 0 },
  TIER_1: { dailyOut: 20_000_000, monthlyOut: 100_000_000 },
  TIER_2: { dailyOut: 100_000_000, monthlyOut: 500_000_000 },
};
