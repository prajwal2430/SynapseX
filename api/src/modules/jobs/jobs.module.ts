import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import {
  QUEUE_EVIDENCE_PROCESSING,
  QUEUE_AI_ANALYSIS,
  QUEUE_REPORT_GENERATION,
} from './constants/job-queues.constant';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { EvidenceProcessingDevWorker } from './workers/evidence-processing.dev-worker';
import { Evidence, EvidenceSchema } from '../evidence/schemas/evidence.schema';
import {
  AnalysisResult,
  AnalysisResultSchema,
} from '../evidence/schemas/analysis-result.schema';
import { AuthModule } from '../auth/auth.module';
import { AiClientModule } from '../ai-client/ai-client.module';
import { EntitiesModule } from '../entities/entities.module';
import { GraphModule } from '../graph/graph.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evidence.name, schema: EvidenceSchema },
      { name: AnalysisResult.name, schema: AnalysisResultSchema },
    ]),
    BullModule.registerQueue(
      { name: QUEUE_EVIDENCE_PROCESSING },
      { name: QUEUE_AI_ANALYSIS },
      { name: QUEUE_REPORT_GENERATION },
    ),
    AuthModule,
    AiClientModule,
    EntitiesModule,
    GraphModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, EvidenceProcessingDevWorker],
  exports: [JobsService, BullModule],
})
export class JobsModule {}
