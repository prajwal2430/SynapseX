"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageConfig = void 0;
const config_1 = require("@nestjs/config");
exports.storageConfig = (0, config_1.registerAs)('storage', () => ({
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketEvidence: process.env.MINIO_BUCKET_EVIDENCE || 'synapsex-evidence',
    bucketReports: process.env.MINIO_BUCKET_REPORTS || 'synapsex-reports',
}));
//# sourceMappingURL=storage.config.js.map