import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import type { ApiErrorResponse } from '../types/api-response.types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Wystąpił nieoczekiwany błąd serwera';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          code?: string;
        };
        message =
          typeof responseObj.message === 'string'
            ? responseObj.message
            : responseObj.message?.join(', ') || exception.message || message;

        if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
          details = responseObj.message;
        } else if (responseObj.message) {
          message = responseObj.message;
        }

        errorCode = responseObj.code || this.getErrorCodeFromStatus(status);
      } else {
        message = exception.message || message;
      }

      errorCode = this.getErrorCodeFromStatus(status);
    } else if (exception instanceof Error) {
      message = exception.message || message;
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        statusCode: status,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    const statusNumber = Number(status);
    if (statusNumber >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${statusNumber} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (statusNumber >= 400 && statusNumber < 500) {
      this.logger.warn(
        `${request.method} ${request.url} - ${statusNumber} - ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): string {
    const errorCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
      [HttpStatus.NOT_ACCEPTABLE]: 'NOT_ACCEPTABLE',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
      [HttpStatus.NOT_IMPLEMENTED]: 'NOT_IMPLEMENTED',
      [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
      [HttpStatus.GATEWAY_TIMEOUT]: 'GATEWAY_TIMEOUT',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }
}
