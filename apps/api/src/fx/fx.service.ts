import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Currency } from '@wealth-os/database';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';

export interface QuotedRate {
  base: Currency;
  quote: Currency;
  midRate: Decimal;
  bidRate: Decimal;
  askRate: Decimal;
  snapshotId: string;
  capturedAt: Date;
}

@Injectable()
export class FxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getLatestRate(base: Currency, quote: Currency): Promise<QuotedRate> {
    if (base === quote) {
      throw new NotFoundException('Base and quote currencies must differ');
    }
    const snapshot = await this.prisma.fxRateSnapshot.findFirst({
      where: { baseCurrency: base, quoteCurrency: quote },
      orderBy: { capturedAt: 'desc' },
    });
    if (!snapshot) {
      throw new NotFoundException(`No FX rate available for ${base}/${quote}`);
    }
    return {
      base,
      quote,
      midRate: new Decimal(snapshot.midRate.toString()),
      bidRate: new Decimal(snapshot.bidRate.toString()),
      askRate: new Decimal(snapshot.askRate.toString()),
      snapshotId: snapshot.id,
      capturedAt: snapshot.capturedAt,
    };
  }

  /**
   * Ingest a mid rate from an upstream provider and derive bid/ask using the
   * configured spread (basis points). Idempotent on the unique key.
   */
  async ingestMidRate(params: {
    base: Currency;
    quote: Currency;
    midRate: string | number;
    capturedAt: Date;
    source: string;
  }) {
    const spreadBps = this.config.get<number>('fx.spreadBps', 50);
    const mid = new Decimal(params.midRate);
    const half = mid.mul(spreadBps).div(20_000); // half-spread each side
    const bid = mid.minus(half);
    const ask = mid.plus(half);

    return this.prisma.fxRateSnapshot.upsert({
      where: {
        baseCurrency_quoteCurrency_capturedAt_source: {
          baseCurrency: params.base,
          quoteCurrency: params.quote,
          capturedAt: params.capturedAt,
          source: params.source,
        },
      },
      update: {},
      create: {
        baseCurrency: params.base,
        quoteCurrency: params.quote,
        midRate: mid.toString(),
        bidRate: bid.toString(),
        askRate: ask.toString(),
        capturedAt: params.capturedAt,
        source: params.source,
      },
    });
  }
}
