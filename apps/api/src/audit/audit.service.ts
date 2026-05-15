import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditInput {
  userId?: string;
  actorType: 'user' | 'system' | 'admin';
  action: string;
  entityType?: string;
  entityId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput) {
    return this.prisma.auditEvent.create({
      data: {
        userId: input.userId,
        actorType: input.actorType,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        payload: input.payload as never,
      },
    });
  }

  async listForUser(userId: string, limit = 100) {
    return this.prisma.auditEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
