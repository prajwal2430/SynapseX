"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const config_1 = require("@nestjs/config");
exports.databaseConfig = (0, config_1.registerAs)('database', () => ({
    uri: process.env.MONGODB_URI ||
        'mongodb://synapsex_user:synapsex_password@localhost:27017/synapsex?authSource=admin',
    options: {
        autoIndex: process.env.NODE_ENV !== 'production',
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '50', 10),
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '10', 10),
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: 'majority',
    },
}));
//# sourceMappingURL=database.config.js.map