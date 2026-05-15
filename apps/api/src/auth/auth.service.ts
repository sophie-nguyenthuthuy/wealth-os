import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@wealth-os/database';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ userId: string; tokens: AuthTokens }> {
    const rounds = this.config.get<number>('bcrypt.rounds', 12);
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            phoneE164: dto.phoneE164,
            email: dto.email,
            passwordHash,
            workerProfile: {
              create: {
                fullName: dto.fullName,
                dateOfBirth: new Date(dto.dateOfBirth),
                hometownProvince: dto.hometownProvince,
                hostCountry: dto.hostCountry,
                visaType: dto.visaType,
                employerName: dto.employerName,
              },
            },
          },
        });

        await tx.auditEvent.create({
          data: {
            userId: created.id,
            actorType: 'user',
            action: 'auth.registered',
            entityType: 'User',
            entityId: created.id,
          },
        });
        return created;
      });

      const tokens = await this.issueTokens(user.id, user.phoneE164);
      return { userId: user.id, tokens };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Phone or email already registered.');
      }
      throw err;
    }
  }

  async login(dto: LoginDto, ctx: { ip?: string; userAgent?: string }): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ phoneE164: dto.identifier }, { email: dto.identifier.toLowerCase() }],
      },
    });
    if (!user) {
      // Constant-time-ish: still hash to avoid leaking existence via timing.
      await bcrypt.compare(
        dto.password,
        '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinval',
      );
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (user.status === 'SUSPENDED' || user.status === 'CLOSED') {
      throw new UnauthorizedException('Account not active');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.prisma.auditEvent.create({
      data: {
        userId: user.id,
        actorType: 'user',
        action: 'auth.login',
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      },
    });

    return this.issueTokens(user.id, user.phoneE164, ctx);
  }

  async refresh(
    refreshToken: string,
    ctx: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    // Rotation: revoke old, mint new.
    const next = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      return this.issueTokens(record.userId, record.user.phoneE164, ctx, tx);
    });
    return next;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    phoneE164: string,
    ctx: { ip?: string; userAgent?: string } = {},
    tx?: Prisma.TransactionClient,
  ): Promise<AuthTokens> {
    const accessTtl = this.config.get<number>('jwt.accessTtlSeconds', 900);
    const refreshTtl = this.config.get<number>('jwt.refreshTtlSeconds', 2_592_000);

    const accessToken = await this.jwt.signAsync(
      { sub: userId, phoneE164 },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: accessTtl,
      },
    );

    const rawRefresh = crypto.randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);

    const client = tx ?? this.prisma;
    await client.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      },
    });

    return { accessToken, refreshToken: rawRefresh, expiresIn: accessTtl };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
