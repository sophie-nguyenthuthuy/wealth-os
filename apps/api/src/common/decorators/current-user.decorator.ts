import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  phoneE164: string;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<FastifyRequest & { user: AuthenticatedUser }>();
    return req.user;
  },
);
