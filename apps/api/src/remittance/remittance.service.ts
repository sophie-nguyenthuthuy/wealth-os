import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Currency, RemittanceStatus } from '@wealth-os/database';
import Decimal from 'decimal.js';
import { REMITTANCE_QUOTE_TTL_SECONDS } from '@wealth-os/shared';
import { FxService } from '../fx/fx.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateQuoteDto } from './dto/quote.dto';

@Injectable()
export class RemittanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fx: FxService,
  ) {}

  /**
   * Creates a non-binding quote. The quote locks an FX rate snapshot for
   * REMITTANCE_QUOTE_TTL_SECONDS; if the user does not confirm in time, the
   * quote expires and they must re-quote at the new rate.
   */
  async createQuote(userId: string, dto: CreateQuoteDto) {
    const corridor = await this.prisma.remittanceCorridor.findFirst({
      where: {
        sourceCurrency: dto.sourceCurrency,
        destCurrency: dto.destCurrency,
        active: true,
      },
    });
    if (!corridor) {
      throw new NotFoundException(
        `No active corridor for ${dto.sourceCurrency} → ${dto.destCurrency}`,
      );
    }

    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id: dto.beneficiaryId, userId, deletedAt: null },
    });
    if (!beneficiary) throw new NotFoundException('Beneficiary not found');

    const sourceAmount = new Decimal(dto.sourceAmount);
    const minA = new Decimal(corridor.minAmount.toString());
    const maxA = new Decimal(corridor.maxAmount.toString());
    if (sourceAmount.lt(minA) || sourceAmount.gt(maxA)) {
      throw new BadRequestException(
        `Amount must be between ${minA.toString()} and ${maxA.toString()} ${corridor.sourceCurrency}`,
      );
    }

    const fee = sourceAmount
      .mul(corridor.feePercentBps)
      .div(10_000)
      .plus(corridor.feeFixed.toString());

    // Net amount to convert, after subtracting the fee in the source currency.
    const netSource = sourceAmount.minus(fee);
    if (netSource.lte(0)) {
      throw new BadRequestException('Fee exceeds source amount');
    }

    const rate = await this.fx.getLatestRate(dto.sourceCurrency, dto.destCurrency);
    // Customer receives at bid rate (we sell quote, buy base).
    const destAmount = netSource.mul(rate.bidRate);

    const quoteExpiresAt = new Date(Date.now() + REMITTANCE_QUOTE_TTL_SECONDS * 1000);

    const remittance = await this.prisma.remittance.create({
      data: {
        userId,
        beneficiaryId: dto.beneficiaryId,
        corridorId: corridor.id,
        status: RemittanceStatus.QUOTED,
        sourceAmount: sourceAmount.toFixed(4),
        sourceCurrency: dto.sourceCurrency,
        destAmount: destAmount.toFixed(4),
        destCurrency: dto.destCurrency,
        feeAmount: fee.toFixed(4),
        feeCurrency: dto.sourceCurrency,
        fxRate: rate.bidRate.toFixed(8),
        fxSnapshotId: rate.snapshotId,
        quoteExpiresAt,
      },
    });

    return remittance;
  }

  /**
   * Confirm an outstanding quote. Validates expiry, debits the source wallet,
   * credits a pending "remittance escrow" entry, and enqueues for partner
   * submission. The partner submission itself is async and handled by a worker.
   */
  async confirmQuote(userId: string, remittanceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.remittance.findFirst({
        where: { id: remittanceId, userId },
      });
      if (!r) throw new NotFoundException('Remittance not found');
      if (r.status !== RemittanceStatus.QUOTED) {
        throw new ConflictException(`Remittance is in status ${r.status}, not QUOTED`);
      }
      if (r.quoteExpiresAt < new Date()) {
        throw new ConflictException('Quote has expired; please request a new quote');
      }

      // Find or create the source wallet for this currency.
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_kind_currency: {
            userId,
            kind: 'PRIMARY',
            currency: r.sourceCurrency as Currency,
          },
        },
      });
      if (!wallet) {
        throw new BadRequestException(`No ${r.sourceCurrency} wallet funded`);
      }

      const totalDebit = new Decimal(r.sourceAmount.toString()); // fee already inside
      if (new Decimal(wallet.balance.toString()).lt(totalDebit)) {
        throw new BadRequestException('Insufficient balance');
      }

      // Post the ledger entry and adjust balance.
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          direction: 'DEBIT',
          type: 'REMITTANCE_OUT',
          amount: totalDebit.toString(),
          currency: r.sourceCurrency,
          correlationId: r.id,
          fxRate: r.fxRate,
          fxSnapshotId: r.fxSnapshotId,
        },
      });
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalDebit.toString() } },
      });

      const updated = await tx.remittance.update({
        where: { id: r.id },
        data: { status: RemittanceStatus.AUTHORIZED, authorizedAt: new Date() },
      });

      await tx.auditEvent.create({
        data: {
          userId,
          actorType: 'user',
          action: 'remittance.authorized',
          entityType: 'Remittance',
          entityId: r.id,
          correlationId: r.id,
          payload: {
            sourceAmount: r.sourceAmount.toString(),
            destAmount: r.destAmount.toString(),
            sourceCurrency: r.sourceCurrency,
            destCurrency: r.destCurrency,
          },
        },
      });

      // TODO: enqueue partner submission job (BullMQ).
      return updated;
    });
  }

  async list(userId: string, opts: { limit: number; offset: number }) {
    const [data, total] = await Promise.all([
      this.prisma.remittance.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: opts.limit,
        skip: opts.offset,
        include: { beneficiary: true },
      }),
      this.prisma.remittance.count({ where: { userId } }),
    ]);
    return { data, meta: { total, ...opts } };
  }

  async getById(userId: string, id: string) {
    const r = await this.prisma.remittance.findFirst({
      where: { id, userId },
      include: { beneficiary: true, corridor: true },
    });
    if (!r) throw new NotFoundException('Remittance not found');
    return r;
  }
}
