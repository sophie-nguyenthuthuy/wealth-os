import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@wealth-os/database';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Logger } from 'nestjs-pino';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();

    const { status, body } = this.mapException(exception);
    body.correlationId = req.id as string;

    if (status >= 500) {
      this.logger.error({ err: exception, path: req.url, correlationId: req.id }, body.message);
    } else if (status >= 400) {
      this.logger.warn(
        { code: body.code, path: req.url, correlationId: req.id },
        body.message,
      );
    }

    res.status(status).send({ error: body });
  }

  private mapException(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const status = exception.getStatus();
      const message =
        typeof response === 'string' ? response : (response as { message?: string }).message ?? exception.message;
      const details =
        typeof response === 'object' && response !== null ? (response as Record<string, unknown>) : undefined;
      return {
        status,
        body: {
          code: this.codeForStatus(status),
          message: Array.isArray(message) ? message.join('; ') : String(message),
          details,
        },
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaKnownError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: { code: 'DB_VALIDATION', message: 'Invalid database input.' },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL', message: 'An unexpected error occurred.' },
    };
  }

  private mapPrismaKnownError(err: Prisma.PrismaClientKnownRequestError): { status: number; body: ErrorBody } {
    switch (err.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          body: {
            code: 'UNIQUE_CONSTRAINT',
            message: 'Resource already exists.',
            details: { target: err.meta?.target },
          },
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          body: { code: 'NOT_FOUND', message: 'Resource not found.' },
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          body: { code: 'FK_CONSTRAINT', message: 'Related resource not found.' },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: { code: 'DB_ERROR', message: 'Database error.' },
        };
    }
  }

  private codeForStatus(status: number): string {
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT';
    if (status === 422) return 'UNPROCESSABLE';
    if (status === 429) return 'RATE_LIMITED';
    if (status >= 500) return 'INTERNAL';
    return 'ERROR';
  }
}
