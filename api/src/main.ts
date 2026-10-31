import { NestFactory } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { createCustomValidationPipe } from './common/pipes/custom-validation.pipe';
import { setupSwagger } from './common/swagger/swagger.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3001);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const corsOrigins = configService.get<string[]>('app.corsOrigins', [
    'http://localhost:3000',
    'http://localhost:5173',
  ]);

  // 1. Security Middleware - Helmet HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for Swagger UI compatibility
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. Performance Middleware - Response Compression
  app.use(compression());

  // 3. Request Payload Size Limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // 4. Global API Prefix
  app.setGlobalPrefix(apiPrefix);

  // 5. API Versioning (URI Versioning -> /api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // 6. Security Middleware - CORS Policy
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin '${origin}' not allowed`));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-Id',
      'X-Internal-Service-Key',
    ],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 3600,
  });

  // 7. Request Validation - Global Strict Validation Pipe
  app.useGlobalPipes(createCustomValidationPipe());

  // 8. Global Error Handling - Exception Filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 9. Global Interceptors - Request Logging & Unified Response Enveloping
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // 10. Swagger / OpenAPI Documentation
  setupSwagger(app);

  await app.listen(port);
  logger.log(`🚀 SynapseX Core API active at: http://localhost:${port}/${apiPrefix}/v1`);
  logger.log(`📚 OpenAPI / Swagger UI: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🩺 Health & Readiness: http://localhost:${port}/${apiPrefix}/health`);
}

bootstrap();
