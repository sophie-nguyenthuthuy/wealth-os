import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InsurancePolicyStatus } from '@wealth-os/database';
import { PrismaService } from '../prisma/prisma.service';
import type { QuotePolicyDto } from './dto/quote.dto';

@Injectable()
export class InsuranceService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts() {
    return this.prisma.insuranceProduct.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { monthlyPremium: 'asc' }],
    });
  }

  async quote(userId: string, dto: QuotePolicyDto) {
    const product = await this.prisma.insuranceProduct.findUnique({
      where: { id: dto.productId, active: true },
    });
    if (!product) throw new NotFoundException('Insurance product not found');

    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id: dto.beneficiaryId, userId, deletedAt: null },
    });
    if (!beneficiary) throw new NotFoundException('Beneficiary not found');

    return this.prisma.insurancePolicy.create({
      data: {
        userId,
        productId: product.id,
        beneficiaryId: beneficiary.id,
        status: InsurancePolicyStatus.QUOTED,
      },
    });
  }

  async activate(userId: string, policyId: string) {
    const policy = await this.prisma.insurancePolicy.findFirst({
      where: { id: policyId, userId },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    if (policy.status !== InsurancePolicyStatus.QUOTED) {
      throw new ConflictException(`Policy is ${policy.status}; cannot activate`);
    }
    const now = new Date();
    const nextDue = new Date(now);
    nextDue.setMonth(nextDue.getMonth() + 1);

    return this.prisma.insurancePolicy.update({
      where: { id: policy.id },
      data: {
        status: InsurancePolicyStatus.ACTIVE,
        startsAt: now,
        nextPremiumDueAt: nextDue,
        policyNumber: `WOS-${Date.now().toString(36).toUpperCase()}`,
      },
    });
  }

  async listPolicies(userId: string) {
    return this.prisma.insurancePolicy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: true, beneficiary: true },
    });
  }
}
