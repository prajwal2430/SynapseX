"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const config_1 = require("@nestjs/config");
exports.appConfig = (0, config_1.registerAs)('app', () => ({
    name: process.env.SERVICE_NAME || 'synapsex-api',
    version: process.env.npm_package_version || '1.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    apiPrefix: process.env.API_PREFIX || 'api',
    corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
        : ['http://localhost:3000', 'http://localhost:5173'],
    logLevel: process.env.LOG_LEVEL || 'debug',
    jwt: {
        accessSecret: process.env.JWT_SECRET || 'dev-insecure-jwt-secret-min-32-chars-synapsex',
        accessExpiresIn: process.env.JWT_EXPIRATION || '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-insecure-jwt-refresh-secret-min-32-chars-synapsex',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
}));
//# sourceMappingURL=app.config.js.map