import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@wealth-os/database';
import { PrismaService } from '../prisma/prisma.service';

export interface SendNotificationInput {
  userId: string;
  channel: NotificationChannel;
  templateKey: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist + dispatch a notification. Actual provider integrations (FCM,
   * Twilio, SES) are stubbed; the row is the source of truth for the worker.
   */
  async send(input: SendNotificationInput) {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        channel: input.channel,
        templateKey: input.templateKey,
        payload: input.payload as never,
        status: NotificationStatus.PENDING,
      },
    });
    this.logger.log(`Queued ${input.channel} notification ${row.id} for ${input.userId}`);
    return row;
  }

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
