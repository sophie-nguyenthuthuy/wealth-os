import Decimal from 'decimal.js';
import { CURRENCY_EXPONENT, type CurrencyCode } from '../constants';

Decimal.set({ precision: 32, rounding: Decimal.ROUND_HALF_EVEN });

export class Money {
  private readonly value: Decimal;
  readonly currency: CurrencyCode;

  private constructor(value: Decimal, currency: CurrencyCode) {
    this.value = value;
    this.currency = currency;
  }

  static of(amount: string | number | Decimal, currency: CurrencyCode): Money {
    return new Money(new Decimal(amount), currency);
  }

  static zero(currency: CurrencyCode): Money {
    return new Money(new Decimal(0), currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.value.plus(other.value), this.currency);
  }

  sub(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.value.minus(other.value), this.currency);
  }

  mulBps(bps: number): Money {
    // bps = basis points, 1 bps = 0.01%. 100 bps = 1%.
    return new Money(this.value.mul(bps).div(10_000), this.currency);
  }

  convert(toCurrency: CurrencyCode, fxRate: string | number | Decimal): Money {
    if (toCurrency === this.currency) return this;
    return new Money(this.value.mul(fxRate), toCurrency);
  }

  isPositive(): boolean {
    return this.value.gt(0);
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  isNegative(): boolean {
    return this.value.lt(0);
  }

  gte(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.gte(other.value);
  }

  lte(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.lte(other.value);
  }

  /** Round to the currency's natural minor-unit precision (banker's rounding). */
  round(): Money {
    const exponent = CURRENCY_EXPONENT[this.currency];
    return new Money(this.value.toDecimalPlaces(exponent, Decimal.ROUND_HALF_EVEN), this.currency);
  }

  toString(): string {
    return this.value.toFixed(4);
  }

  toDecimal(): Decimal {
    return this.value;
  }

  toJSON(): { amount: string; currency: CurrencyCode } {
    return { amount: this.toString(), currency: this.currency };
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
