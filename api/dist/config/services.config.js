"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesConfig = void 0;
const config_1 = require("@nestjs/config");
exports.servicesConfig = (0, config_1.registerAs)('services', () => ({
    aiService: {
        url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
        apiKey: process.env.AI_SERVICE_API_KEY || process.env.INTERNAL_SERVICE_KEY || 'synapsex-internal-secret-dev-key',
        timeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '15000', 10),
    },
}));
//# sourceMappingURL=services.config.js.map