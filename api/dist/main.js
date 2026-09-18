"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const compression_1 = require("compression");
const express_1 = require("express");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const custom_validation_pipe_1 = require("./common/pipes/custom-validation.pipe");
const swagger_config_1 = require("./common/swagger/swagger.config");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port', 3001);
    const apiPrefix = configService.get('app.apiPrefix', 'api');
    const corsOrigins = configService.get('app.corsOrigins', [
        'http://localhost:3000',
        'http://localhost:5173',
    ]);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use((0, compression_1.default)());
    app.use((0, express_1.json)({ limit: '10mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '10mb' }));
    app.setGlobalPrefix(apiPrefix);
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
        prefix: 'v',
    });
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
                callback(null, true);
            }
            else {
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
    app.useGlobalPipes((0, custom_validation_pipe_1.createCustomValidationPipe)());
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter(), new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new transform_interceptor_1.TransformInterceptor());
    (0, swagger_config_1.setupSwagger)(app);
    await app.listen(port);
    logger.log(`🚀 SynapseX Core API active at: http://localhost:${port}/${apiPrefix}/v1`);
    logger.log(`📚 OpenAPI / Swagger UI: http://localhost:${port}/${apiPrefix}/docs`);
    logger.log(`🩺 Health & Readiness: http://localhost:${port}/${apiPrefix}/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map