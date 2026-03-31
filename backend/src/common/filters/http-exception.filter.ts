import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const errorObj = exceptionResponse as any;
        if (errorObj.error) {
          // Already formatted error from controllers
          return response.status(status).json(errorObj);
        }
        message = errorObj.message || message;
      } else {
        message = exceptionResponse as string;
      }

      // Map status codes to error codes
      switch (status) {
        case HttpStatus.BAD_REQUEST:
          code = 'VALIDATION_ERROR';
          break;
        case HttpStatus.UNAUTHORIZED:
          code = 'UNAUTHORIZED';
          break;
        case HttpStatus.FORBIDDEN:
          code = 'FORBIDDEN';
          break;
        case HttpStatus.NOT_FOUND:
          code = 'NOT_FOUND';
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          code = 'RATE_LIMIT_EXCEEDED';
          break;
        default:
          code = 'SERVER_ERROR';
      }
    }

    response.status(status).json({
      error: {
        code,
        message,
      },
    });
  }
}
