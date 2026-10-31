import { registerAs } from '@nestjs/config';

export const servicesConfig = registerAs('services', () => ({
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.AI_SERVICE_API_KEY || process.env.INTERNAL_SERVICE_KEY || 'synapsex-internal-secret-dev-key',
    timeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '15000', 10),
  },
}));
