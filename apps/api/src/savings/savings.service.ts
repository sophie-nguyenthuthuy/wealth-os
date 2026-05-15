import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAutoSavingsRuleDto } from './dto/rule.dto';

@Injectable()
export class SavingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listWallets(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId },
      orderBy: [{ kind: 'asc' }, { currency: 'asc' }],
    });
  }

  async listRules(userId: string) {
    return this.prisma.autoSavingsRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(userId: string, dto: CreateAutoSavingsRuleDto) {
    if (!dto.percentBps && !dto.fixedAmount) {
      throw new BadRequestException('Either percentBps or fixedAmount required');
    }
    if (dto.fixedAmount && !dto.fixedCurrency) {
      throw new BadRequestException('fixedCurrency required when fixedAmount is set');
    }

    const [source, target] = await Promise.all([
      this.prisma.wallet.findFirst({ where: { id: dto.sourceWalletId, userId } }),
      this.prisma.wallet.findFirst({ where: { id: dto.targetWalletId, userId } }),
    ]);
    if (!source || !target) throw new NotFoundException('Wallet not found');
    if (source.id === target.id) throw new BadRequestException('Source and target must differ');

    return this.prisma.autoSavingsRule.create({
      data: {
        userId,
        sourceWalletId: dto.sourceWalletId,
        targetWalletId: dto.targetWalletId,
        trigger: dto.trigger,
        percentBps: dto.percentBps,
        fixedAmount: dto.fixedAmount,
        fixedCurrency: dto.fixedCurrency,
      },
    });
  }

  async deactivateRule(userId: string, ruleId: string) {
    const result = await this.prisma.autoSavingsRule.updateMany({
      where: { id: ruleId, userId },
      data: { active: false },
    });
    if (result.count === 0) throw new NotFoundException('Rule not found');
  }
}
