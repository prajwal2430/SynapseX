import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse, ValidationErrorDetail } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal error occurred';
    let errors: ValidationErrorDetail[] | undefined = undefined;

    // 1. NestJS Standard HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const resObj = res as any;
        message = resObj.message || exception.message;
        if (Array.isArray(resObj.errors)) {
          errors = resObj.errors;
        }
      } else {
        message = exception.message;
      }
    }
    // 2. Mongoose Duplicate Key Error (Code 11000)
    else if (exception?.code === 11000) {
      status = HttpStatus.CONFLICT;
      const duplicatedField = Object.keys(exception.keyPattern || {})[0] || 'field';
      message = `A resource with the specified '${duplicatedField}' already exists.`;
    }
    // 3. Mongoose CastError (e.g. invalid ObjectId format)
    else if (exception?.name === 'CastError') {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid format for identifier '${exception.path}': received '${exception.value}'`;
    }
    // 4. Mongoose Document Validation Error
    else if (exception?.name === 'ValidationError' && exception?.errors) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database validation constraint failed';
      errors = Object.keys(exception.errors).map((key) => ({
        field: key,
        constraints: [exception.errors[key]?.message || 'Invalid value'],
      }));
    }
    // 5. General Error instance
    else if (exception instanceof Error) {
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error occurred'
          : exception.message;
    }

    // Structured logging
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Message: ${
        typeof message === 'object' ? JSON.stringify(message) : message
      }`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse: ApiResponse<null> = {
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    response.status(status).json(errorResponse);
  }
}
