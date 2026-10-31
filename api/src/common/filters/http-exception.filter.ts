import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse, ValidationErrorDetail } from '../interfaces/api-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const requestId = (request.headers['x-request-id'] as string) || undefined;

    let message: string | string[] = exception.message;
    let errors: ValidationErrorDetail[] | undefined = undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as any;
      message = respObj.message || exception.message;
      if (Array.isArray(respObj.errors)) {
        errors = respObj.errors;
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    this.logger.warn(
      `HTTP ${status} [${request.method}] ${request.url} - ${JSON.stringify(errorResponse.message)}`,
    );

    response.status(status).json(errorResponse);
  }
}
