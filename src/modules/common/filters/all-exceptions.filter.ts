import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

interface PostgresError {
  code: string;
  detail: string;
}

export interface IValidationError {
  [key: string]: {
    message: string;
    value?: any;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    let errorType = 'Internal Server Error';
    let validationErrors: unknown;
    let errorMessage: string | undefined;
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      errorType = exception.name;
      errorMessage = exception.message;
      validationErrors = (exception as any)?.response?.validationErrors;

      if (validationErrors) {
        errorMessage = 'Validation error in the request';
      }

      // When the exception was constructed with a structured object payload
      // (e.g. ForbiddenException({ errorCode: 'TERMS_NOT_ACCEPTED', ... })),
      // spread the payload into the response so callers can read top-level keys
      // like `body.errorCode` directly — matching the frontend's MutationErrorListener contract.
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null && !Array.isArray(exceptionResponse)) {
        const structured = exceptionResponse as Record<string, unknown>;
        // Only spread when the payload carries domain-specific keys beyond the standard NestJS fields
        if ('errorCode' in structured) {
          return this.sendStructuredErrorResponse(httpAdapter, ctx, request, httpStatus, errorType, structured);
        }
      }

      return this.sendErrorResponse(httpAdapter, ctx, request, httpStatus, errorType, errorMessage, validationErrors);
    }

    if (exception instanceof QueryFailedError) {
      const pgError = exception as unknown as PostgresError;

      if (pgError.code === '23505') {
        const { detail } = pgError;

        const regex = /\((.*?)\)=\((.*?)\)/;
        const [property, value] = detail.match(regex)?.slice(1) || [];
        errorMessage = `The property "${property}" with value "${value}" already exists`;

        httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;
        errorType = 'Duplicate key';

        const error: IValidationError = { [property]: { message: 'El email ya está en uso', value } };

        validationErrors = error;

        return this.sendErrorResponse(httpAdapter, ctx, request, httpStatus, errorType, errorMessage, validationErrors);
      }

      errorMessage = 'Database error';
      this.logger.error(exception);

      return this.sendErrorResponse(httpAdapter, ctx, request, httpStatus, errorType, errorMessage, validationErrors);
    }

    this.logger.error(exception);

    return this.sendErrorResponse(httpAdapter, ctx, request, httpStatus, errorType, errorMessage, validationErrors);
  }

  private sendErrorResponse(
    httpAdapter: any,
    ctx: any,
    request: any,
    httpStatus: number,
    errorType: string,
    errorMessage: string | undefined,
    validationErrors: unknown,
  ) {
    const responseBody = {
      statusCode: httpStatus,
      path: request.url,
      errorType,
      timestamp: new Date().toISOString(),
      errorMessage,
      errors: validationErrors,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  /**
   * Sends a structured error response for exceptions whose payload contains
   * domain-specific keys (e.g. errorCode). The payload is spread at the top
   * level so the frontend can read `body.errorCode` directly.
   */
  private sendStructuredErrorResponse(
    httpAdapter: any,
    ctx: any,
    request: any,
    httpStatus: number,
    errorType: string,
    payload: Record<string, unknown>,
  ) {
    const responseBody = {
      statusCode: httpStatus,
      path: request.url,
      errorType,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
