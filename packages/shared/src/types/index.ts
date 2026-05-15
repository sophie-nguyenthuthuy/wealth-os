import type { CurrencyCode } from '../constants';

export interface MoneyDTO {
  amount: string; // string-encoded decimal, e.g. "1234.5600"
  currency: CurrencyCode;
}

export interface FxQuoteDTO {
  base: CurrencyCode;
  quote: CurrencyCode;
  midRate: string;
  bidRate: string;
  askRate: string;
  capturedAt: string; // ISO 8601
  source: string;
}

export interface RemittanceQuoteDTO {
  corridorId: string;
  source: MoneyDTO;
  destination: MoneyDTO;
  fee: MoneyDTO;
  fxRate: string;
  expiresAt: string;
}

export interface PageMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PageMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}
