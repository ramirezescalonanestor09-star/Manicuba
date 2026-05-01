import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

interface ApiErrorBody {
  statusCode: number;
  message: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const body = this.toBody(exception);
    if (body.statusCode >= 500) {
      this.logger.error(
        `Unhandled error: ${exception instanceof Error ? exception.stack : exception}`,
      );
    }
    res.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return { statusCode: status, message: response };
      }
      const data = response as Record<string, unknown>;
      const message =
        typeof data.message === 'string'
          ? data.message
          : Array.isArray(data.message)
          ? data.message.join(', ')
          : exception.message;
      return {
        statusCode: status,
        message,
        details: data.issues ?? data.errors ?? undefined,
      };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Ya existe un registro con esos datos',
          details: exception.meta,
        };
      }
      if (exception.code === 'P2025') {
        return { statusCode: HttpStatus.NOT_FOUND, message: 'No encontrado' };
      }
    }
    if (exception instanceof Error) {
      return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error interno' };
    }
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error desconocido' };
  }
}
