import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  bucketEvidence: process.env.MINIO_BUCKET_EVIDENCE || 'synapsex-evidence',
  bucketReports: process.env.MINIO_BUCKET_REPORTS || 'synapsex-reports',
}));
