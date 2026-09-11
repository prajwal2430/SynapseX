import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3001;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api';

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = 'http://localhost:3000,http://localhost:5173';

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'debug';

  // MongoDB Connection
  @IsString()
  @IsNotEmpty({ message: 'MONGODB_URI is required' })
  MONGODB_URI: string;

  @IsString()
  @IsOptional()
  MONGODB_MAX_POOL_SIZE?: string = '50';

  @IsString()
  @IsOptional()
  MONGODB_MIN_POOL_SIZE?: string = '10';

  // Redis (Optional for core foundation)
  @IsString()
  @IsOptional()
  REDIS_HOST?: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT?: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  // Object Storage (Optional for core foundation)
  @IsString()
  @IsOptional()
  MINIO_ENDPOINT?: string = 'localhost';

  @IsNumber()
  @IsOptional()
  MINIO_PORT?: number = 9000;

  @IsString()
  @IsOptional()
  MINIO_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  MINIO_SECRET_KEY?: string;

  // AI Service (Optional for core foundation)
  @IsString()
  @IsOptional()
  AI_SERVICE_URL?: string = 'http://localhost:8000';

  @IsString()
  @IsOptional()
  AI_SERVICE_API_KEY?: string;

  // Neo4j Knowledge Graph (Optional for core foundation)
  @IsString()
  @IsOptional()
  NEO4J_URI?: string = 'bolt://localhost:7687';

  @IsString()
  @IsOptional()
  NEO4J_USER?: string = 'neo4j';

  @IsString()
  @IsOptional()
  NEO4J_PASSWORD?: string;

  @IsString()
  @IsOptional()
  NEO4J_DATABASE?: string = 'neo4j';
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map((error) => {
        const constraints = Object.values(error.constraints || {}).join(', ');
        return `[ENV_ERROR] ${error.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(
      `\n❌ Invalid Application Environment Configuration:\n${formattedErrors}\n`,
    );
  }

  return validatedConfig;
}
