import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationErrorDetail } from '../interfaces/api-response.interface';

function formatValidationErrors(
  errors: ValidationError[],
): ValidationErrorDetail[] {
  const result: ValidationErrorDetail[] = [];

  function extractErrors(error: ValidationError, parentField = '') {
    const fieldName = parentField
      ? `${parentField}.${error.property}`
      : error.property;

    if (error.constraints) {
      result.push({
        field: fieldName,
        constraints: Object.values(error.constraints),
      });
    }

    if (error.children && error.children.length > 0) {
      for (const child of error.children) {
        extractErrors(child, fieldName);
      }
    }
  }

  for (const err of errors) {
    extractErrors(err);
  }

  return result;
}

export function createCustomValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (validationErrors: ValidationError[] = []) => {
      const formattedErrors = formatValidationErrors(validationErrors);
      const fieldCount = formattedErrors.length;
      return new BadRequestException({
        message: `Validation failed on ${fieldCount} field${fieldCount === 1 ? '' : 's'}`,
        errors: formattedErrors,
      });
    },
  });
}
