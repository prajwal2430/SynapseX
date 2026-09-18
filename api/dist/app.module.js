"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const config_2 = require("./config");
const bullmq_1 = require("@nestjs/bullmq");
const database_module_1 = require("./database/database.module");
const health_module_1 = require("./modules/health/health.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const cases_module_1 = require("./modules/cases/cases.module");
const evidence_module_1 = require("./modules/evidence/evidence.module");
const custody_module_1 = require("./modules/custody/custody.module");
const audit_module_1 = require("./modules/audit/audit.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const entities_module_1 = require("./modules/entities/entities.module");
const timeline_module_1 = require("./modules/timeline/timeline.module");
const findings_module_1 = require("./modules/findings/findings.module");
const graph_module_1 = require("./modules/graph/graph.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const request_id_middleware_1 = require("./common/middleware/request-id.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_1.RequestIdMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [config_2.appConfig, config_2.databaseConfig, config_2.redisConfig, config_2.storageConfig, config_2.servicesConfig, config_2.neo4jConfig],
                validate: config_2.validateEnvironment,
                envFilePath: ['.env', '.env.local'],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => [
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
                inject: [config_1.ConfigService],
            }),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    connection: {
                        host: configService.get('redis.host', 'localhost'),
                        port: configService.get('redis.port', 6379),
                        password: configService.get('redis.password') || undefined,
                        db: configService.get('redis.db', 0),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            database_module_1.DatabaseModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            cases_module_1.CasesModule,
            evidence_module_1.EvidenceModule,
            custody_module_1.CustodyModule,
            audit_module_1.AuditModule,
            jobs_module_1.JobsModule,
            entities_module_1.EntitiesModule,
            timeline_module_1.TimelineModule,
            findings_module_1.FindingsModule,
            graph_module_1.GraphModule,
            realtime_module_1.RealtimeModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map