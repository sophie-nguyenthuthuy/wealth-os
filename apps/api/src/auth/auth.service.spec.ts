import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      refreshToken: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
      auditEvent: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (fn) => fn(prismaMock)),
    };
    jwtMock = { signAsync: jest.fn().mockResolvedValue('signed.jwt') };
    const config = {
      get: (k: string, d?: unknown) => {
        const values: Record<string, unknown> = {
          'bcrypt.rounds': 4,
          'jwt.accessSecret': 'a'.repeat(32),
          'jwt.accessTtlSeconds': 900,
          'jwt.refreshTtlSeconds': 60,
        };
        return values[k] ?? d;
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('login', () => {
    it('rejects unknown identifier with UnauthorizedException', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ identifier: '+819000000000', password: 'pass1234567' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects wrong password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'u1',
        phoneE164: '+819000000000',
        passwordHash,
        status: 'ACTIVE',
      });
      await expect(
        service.login({ identifier: '+819000000000', password: 'wrong' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('issues tokens on success', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'u1',
        phoneE164: '+819000000000',
        passwordHash,
        status: 'ACTIVE',
      });
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({});

      const tokens = await service.login(
        { identifier: '+819000000000', password: 'correct-password' },
        {},
      );
      expect(tokens.accessToken).toBe('signed.jwt');
      expect(tokens.refreshToken).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(tokens.expiresIn).toBe(900);
    });
  });

  describe('register', () => {
    it('translates P2002 to ConflictException', async () => {
      prismaMock.$transaction.mockRejectedValue({
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
      });
      // Make the exception instanceof check pass by attaching the prototype.
      const { Prisma } = await import('@wealth-os/database');
      const err = Object.assign(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
        {},
      );
      prismaMock.$transaction.mockRejectedValue(err);
      await expect(
        service.register({
          phoneE164: '+819000000000',
          password: 'a-long-pass',
          fullName: 'Test',
          dateOfBirth: '2000-01-01',
          hometownProvince: 'X',
          hostCountry: 'JP' as never,
          visaType: 'TECHNICAL_INTERN' as never,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
