export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'v1',
  corsOrigins: process.env.CORS_ORIGINS ?? '',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  database: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE ?? '10', 10),
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessTtlSeconds: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshTtlSeconds: parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10),
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  },
  remittance: {
    partner: process.env.REMITTANCE_PARTNER ?? 'sbi-remit',
    partnerApiKey: process.env.REMITTANCE_PARTNER_API_KEY ?? '',
    partnerBaseUrl: process.env.REMITTANCE_PARTNER_BASE_URL ?? '',
  },
  fx: {
    provider: process.env.FX_PROVIDER ?? 'openexchangerates',
    apiKey: process.env.FX_PROVIDER_API_KEY ?? '',
    refreshIntervalSeconds: parseInt(process.env.FX_REFRESH_INTERVAL_SECONDS ?? '300', 10),
    spreadBps: parseInt(process.env.FX_SPREAD_BPS ?? '50', 10),
  },
  throttle: {
    ttlSeconds: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  },
});
