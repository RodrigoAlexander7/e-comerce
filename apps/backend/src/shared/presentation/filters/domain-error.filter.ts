import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  InvalidValueError,
  NotFoundError,
} from '../../domain/domain-error.js';

/**
 * Traduce errores de dominio a respuestas HTTP.
 *
 * Existe para que el dominio pueda lanzar errores expresivos sin importar
 * NestJS ni conocer codigos de estado. Toda la dependencia de HTTP queda
 * concentrada en este archivo.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.statusFor(error);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(error.message, error.stack);
    }

    response.status(status).json({
      statusCode: status,
      code: error.code,
      message: error.message,
    });
  }

  private statusFor(error: DomainError): number {
    if (error instanceof NotFoundError) return HttpStatus.NOT_FOUND;
    if (error instanceof ConflictError) return HttpStatus.CONFLICT;
    if (error instanceof BusinessRuleError) return HttpStatus.UNPROCESSABLE_ENTITY;
    if (error instanceof InvalidValueError) return HttpStatus.UNPROCESSABLE_ENTITY;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
