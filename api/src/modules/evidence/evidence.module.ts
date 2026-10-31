import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Evidence, EvidenceSchema } from './schemas/evidence.schema';
import { CustodyLog, CustodyLogSchema } from './schemas/custody-log.schema';
import { AnalysisResult, AnalysisResultSchema } from './schemas/analysis-result.schema';
import { Case, CaseSchema } from '../cases/schemas/case.schema';
import { EvidenceController } from './evidence.controller';
import { EvidenceService, EVIDENCE_QUEUE_NAME } from './evidence.service';
import { StorageService } from './services/storage.service';
import { MinioStorageService } from './storage/minio-storage.service';
import { EVIDENCE_STORAGE_SERVICE } from './storage/evidence-storage.interface';
import { AuthModule } from '../auth/auth.module';
import { AiClientModule } from '../ai-client/ai-client.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evidence.name, schema: EvidenceSchema },
      { name: CustodyLog.name, schema: CustodyLogSchema },
      { name: AnalysisResult.name, schema: AnalysisResultSchema },
      { name: Case.name, schema: CaseSchema },
    ]),
    BullModule.registerQueue({
      name: EVIDENCE_QUEUE_NAME,
    }),
    AuthModule,
    AiClientModule,
  ],
  controllers: [EvidenceController],
  providers: [
    EvidenceService,
    MinioStorageService,
    StorageService,
    {
      provide: EVIDENCE_STORAGE_SERVICE,
      useExisting: MinioStorageService,
    },
  ],
  exports: [
    EvidenceService,
    MinioStorageService,
    StorageService,
    EVIDENCE_STORAGE_SERVICE,
  ],
})
export class EvidenceModule {}
