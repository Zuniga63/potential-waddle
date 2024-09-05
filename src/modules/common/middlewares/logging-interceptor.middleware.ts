import { CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';

export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const statusCode = res.statusCode;
        const elapsedTime = Date.now() - startTime;

        this.logger.log(`${method} ${url} ${statusCode} - ${elapsedTime}ms`);
      }),
      catchError(error => {
        const elapsedTime = Date.now() - startTime;
        this.logger.error(`${method} ${url} ${error.status || 500} - ${elapsedTime}ms - Error: ${error.message}`);

        throw error; // Rethrow the error after logging
      }),
    );
  }
}
