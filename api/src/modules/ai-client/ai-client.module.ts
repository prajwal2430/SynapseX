import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AI_SERVICE_CLIENT } from './interfaces/ai-service-client.interface';
import { FastApiAiServiceClient } from './services/fastapi-ai-service.client';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    FastApiAiServiceClient,
    {
      provide: AI_SERVICE_CLIENT,
      useExisting: FastApiAiServiceClient,
    },
  ],
  exports: [AI_SERVICE_CLIENT, FastApiAiServiceClient],
})
export class AiClientModule {}
