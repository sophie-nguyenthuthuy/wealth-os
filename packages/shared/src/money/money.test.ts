import { Money } from './index';

describe('Money', () => {
  it('adds same-currency amounts', () => {
    const a = Money.of('100.50', 'VND');
    const b = Money.of('50.25', 'VND');
    expect(a.add(b).toString()).toBe('150.7500');
  });

  it('rejects cross-currency arithmetic', () => {
    expect(() => Money.of('1', 'VND').add(Money.of('1', 'JPY'))).toThrow(/Currency mismatch/);
  });

  it('applies basis-point multiplier correctly', () => {
    // 30 bps of 10,000 = 30
    const fee = Money.of('10000', 'JPY').mulBps(30);
    expect(fee.toString()).toBe('30.0000');
  });

  it('converts via FX rate', () => {
    // 1 JPY = 175 VND
    const dest = Money.of('1000', 'JPY').convert('VND', '175');
    expect(dest.toString()).toBe('175000.0000');
    expect(dest.currency).toBe('VND');
  });

  it('rounds to currency-specific precision', () => {
    expect(Money.of('100.5678', 'VND').round().toString()).toBe('101.0000'); // 0-decimal
    expect(Money.of('100.5678', 'JPY').round().toString()).toBe('101.0000'); // 0-decimal
    expect(Money.of('100.5678', 'USD').round().toString()).toBe('100.5700'); // 2-decimal
  });

  it('serializes to JSON DTO shape', () => {
    expect(Money.of('42.5', 'USD').toJSON()).toEqual({ amount: '42.5000', currency: 'USD' });
  });
});
