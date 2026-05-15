import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvestmentOrderStatus, InvestmentOrderType } from '@wealth-os/database';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class InvestmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listFunds() {
    return this.prisma.fund.findMany({
      where: { active: true },
      orderBy: { ticker: 'asc' },
      include: {
        navHistory: { orderBy: { navDate: 'desc' }, take: 1 },
      },
    });
  }

  async getFund(id: string) {
    const fund = await this.prisma.fund.findUnique({
      where: { id },
      include: { navHistory: { orderBy: { navDate: 'desc' }, take: 30 } },
    });
    if (!fund) throw new NotFoundException('Fund not found');
    return fund;
  }

  async listHoldings(userId: string) {
    return this.prisma.fundHolding.findMany({
      where: { userId, units: { gt: 0 } },
      include: { fund: { include: { navHistory: { orderBy: { navDate: 'desc' }, take: 1 } } } },
    });
  }

  /**
   * Create a fund order. Pricing against the next-available NAV is settled by
   * an async worker job. Here we only validate + persist the order.
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    const fund = await this.prisma.fund.findUnique({ where: { id: dto.fundId, active: true } });
    if (!fund) throw new NotFoundException('Fund not found');

    const value = new Decimal(dto.amountOrUnits);
    if (value.lte(0)) throw new BadRequestException('Amount must be positive');

    if (dto.type === InvestmentOrderType.BUY) {
      if (value.lt(fund.minBuyAmount.toString())) {
        throw new BadRequestException(`Minimum buy is ${fund.minBuyAmount} ${fund.currency}`);
      }
    } else {
      const holding = await this.prisma.fundHolding.findUnique({
        where: { userId_fundId: { userId, fundId: fund.id } },
      });
      if (!holding || new Decimal(holding.units.toString()).lt(value)) {
        throw new BadRequestException('Insufficient units to sell');
      }
    }

    return this.prisma.investmentOrder.create({
      data: {
        userId,
        fundId: fund.id,
        type: dto.type,
        status: InvestmentOrderStatus.CREATED,
        amount: dto.type === InvestmentOrderType.BUY ? value.toString() : undefined,
        units: dto.type === InvestmentOrderType.SELL ? value.toString() : undefined,
      },
    });
  }

  async listOrders(userId: string) {
    return this.prisma.investmentOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { fund: true },
    });
  }
}
