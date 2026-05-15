import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EnvelopedResponse<T> {
  data: T;
  meta: {
    correlationId: string;
    timestamp: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, EnvelopedResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<EnvelopedResponse<T>> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          correlationId: req.id as string,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
