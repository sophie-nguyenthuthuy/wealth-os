import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateWorkerProfileDto } from './dto/update-profile.dto';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { union: true },
    });
    if (!profile) throw new NotFoundException('Worker profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateWorkerProfileDto) {
    return this.prisma.workerProfile.update({
      where: { userId },
      data: {
        employerName: dto.employerName,
        unionId: dto.unionId,
        visaExpiresAt: dto.visaExpiresAt ? new Date(dto.visaExpiresAt) : undefined,
        expectedReturnAt: dto.expectedReturnAt ? new Date(dto.expectedReturnAt) : undefined,
      },
    });
  }

  async listUnions(country?: string) {
    return this.prisma.union.findMany({
      where: { active: true, country: country as never },
      orderBy: { name: 'asc' },
    });
  }
}
