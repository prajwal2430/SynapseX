import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  storageConfig,
  servicesConfig,
  neo4jConfig,
  validateEnvironment,
} from './config';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CasesModule } from './modules/cases/cases.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { CustodyModule } from './modules/custody/custody.module';
import { AuditModule } from './modules/audit/audit.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { FindingsModule } from './modules/findings/findings.module';
import { GraphModule } from './modules/graph/graph.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    // 1. Configuration & Startup Validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, storageConfig, servicesConfig, neo4jConfig],
      validate: validateEnvironment,
      envFilePath: ['.env', '.env.local'],
    }),

    // 2. Security Middleware - Multi-tier Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: 10,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 50,
        },
        {
          name: 'long',
          ttl: 60000,
          limit: 200,
        },
      ],
      inject: [ConfigService],
    }),

    // 3. BullMQ Distributed Queue Configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password') || undefined,
          db: configService.get<number>('redis.db', 0),
        },
      }),
      inject: [ConfigService],
    }),

    // 4. Database Module (Mongoose + Connection Lifecycle)
    DatabaseModule,

    // 5. Feature Modules
    HealthModule,
    AuthModule,
    UsersModule,
    CasesModule,
    EvidenceModule,
    CustodyModule,
    AuditModule,
    JobsModule,
    EntitiesModule,
    TimelineModule,
    FindingsModule,
    GraphModule,
    RealtimeModule,
  ],
  providers: [
    // Global Throttler Guard for rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
