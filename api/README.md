# SynapseX API Service

The primary enterprise backend application for **SynapseX**, built with [NestJS](https://nestjs.com/) and [TypeScript](https://www.typescriptlang.org/).

## Core Production Foundations

The API service establishes the 10 foundational pillars for enterprise readiness:

1. **Configuration**: Modular, strongly typed configuration modules (`app`, `database`, `redis`, `storage`, `services`).
2. **MongoDB Connection**: `@nestjs/mongoose` with production connection pooling (`maxPoolSize`, `minPoolSize`, reconnect timeouts) and lifecycle event logging.
3. **Environment Validation**: Startup schema validation via `class-validator` in `env.validation.ts` to fail fast on invalid or missing configurations.
4. **Global Error Handling**: Comprehensive exception filters (`AllExceptionsFilter`, `HttpExceptionFilter`) capturing NestJS errors, Mongoose `CastError`, `ValidationError`, and MongoDB `11000` duplicate key violations with standardized envelopes.
5. **Logging**: Request correlation via `RequestIdMiddleware` (`X-Request-Id`) and `LoggingInterceptor` capturing method, route, IP, user agent, status code, and execution duration in ms.
6. **API Versioning**: URI-based versioning (`VersioningType.URI`, prefix `v`) mounting versioned endpoints under `/api/v1/...`.
7. **Swagger / OpenAPI**: Automated OpenAPI 3.0 specification generation via `@nestjs/swagger` with JWT Bearer & internal service token auth at `/api/docs`.
8. **Health Check**: Comprehensive `@nestjs/terminus` probes for MongoDB, Redis, and memory thresholds at `/api/health`, `/api/health/liveness`, and `/api/health/readiness`.
9. **Request Validation**: Global `createCustomValidationPipe()` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, and detailed field-level error reporting.
10. **Security Middleware**: `helmet` security headers, `compression` for HTTP payload responses, strict `cors` policies, and `@nestjs/throttler` multi-tier rate limiting.

## Technology Stack

- **Framework**: NestJS v10
- **Language**: TypeScript 5.6
- **Database**: MongoDB 7.0 via `@nestjs/mongoose` and `mongoose`
- **Cache & Message Broker**: Redis 7.0 via `ioredis`
- **Queue System**: BullMQ via `@nestjs/bullmq`
- **WebSockets**: Socket.IO via `@nestjs/websockets`
- **Health Checks**: `@nestjs/terminus`
- **Security**: `helmet`, `@nestjs/throttler`, `compression`
- **Documentation**: `@nestjs/swagger`
- **Object Storage**: MinIO SDK (`minio`)

## Directory Structure

```
api/
├── src/
│   ├── config/             # Typed config loaders & env validation
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── env.validation.ts
│   │   ├── redis.config.ts
│   │   ├── services.config.ts
│   │   └── storage.config.ts
│   ├── common/             # Cross-cutting concerns
│   │   ├── decorators/     # Custom parameter and route decorators
│   │   ├── filters/        # Global exception filters (Http, AllExceptions)
│   │   ├── guards/         # Authentication and RBAC guards
│   │   ├── interceptors/   # Logging and response transform interceptors
│   │   ├── interfaces/     # Shared DTO and API response contracts
│   │   ├── middleware/     # RequestId correlation middleware
│   │   └── pipes/          # Custom validation pipe with field-level errors
│   ├── gateway/            # Socket.IO WebSocket Gateway & room handling
│   ├── health/             # Terminus health check controller & ping indicators
│   ├── queues/             # BullMQ queue registration and constants
│   ├── swagger/            # OpenAPI 3.0 Swagger configuration
│   ├── modules/            # Domain business modules
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts             # Application bootstrap & middleware pipeline
├── .env.example            # Environment variables template
├── .gitignore
├── Dockerfile              # Multi-stage production & development container
├── nest-cli.json           # NestJS CLI configuration
├── package.json
└── tsconfig.json           # TypeScript configuration with path aliases
```

## Environment Variables

Copy `.env.example` to `.env` before running:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | API listen port | `3001` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `API_PREFIX` | Global route prefix | `api` |
| `CORS_ORIGINS` | Permitted CORS origins | `http://localhost:3000,http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://synapsex_user:synapsex_password@localhost:27017/synapsex?authSource=admin` |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `MINIO_ENDPOINT` | MinIO host | `localhost` |
| `MINIO_PORT` | MinIO API port | `9000` |
| `MINIO_BUCKET_EVIDENCE` | Storage bucket for raw evidence files | `synapsex-evidence` |
| `AI_SERVICE_URL` | Endpoint of the Python AI microservice | `http://localhost:8000` |
| `JWT_SECRET` | Secret key for signing access JWTs | Placeholder |

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start in watch mode
npm run start:dev

# Start in debug mode
npm run start:debug
```

### Build & Production Run

```bash
# Build TypeScript to dist/
npm run build

# Start production server
npm run start:prod
```

### Docker Execution

```bash
docker build -t synapsex-api .
docker run -p 3001:3001 synapsex-api
```
