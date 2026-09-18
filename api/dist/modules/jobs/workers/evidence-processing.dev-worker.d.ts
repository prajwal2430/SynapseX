import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { EvidenceProcessingJobPayload } from '../constants/job-queues.constant';
import { EvidenceDocument } from '../../evidence/schemas/evidence.schema';
import { AnalysisResultDocument } from '../../evidence/schemas/analysis-result.schema';
import { IAiServiceClient } from '../../ai-client/interfaces/ai-service-client.interface';
import { EntitiesService } from '../../entities/entities.service';
import { GraphService } from '../../graph/graph.service';
import { RealtimeEventsService } from '../../realtime/services/realtime-events.service';
export declare class EvidenceProcessingDevWorker extends WorkerHost {
    private readonly evidenceModel;
    private readonly analysisResultModel;
    private readonly aiServiceClient?;
    private readonly entitiesService?;
    private readonly graphService?;
    private readonly realtimeEventsService?;
    private readonly logger;
    constructor(evidenceModel: Model<EvidenceDocument>, analysisResultModel: Model<AnalysisResultDocument>, aiServiceClient?: IAiServiceClient, entitiesService?: EntitiesService, graphService?: GraphService, realtimeEventsService?: RealtimeEventsService);
    process(job: Job<EvidenceProcessingJobPayload>): Promise<{
        processed: boolean;
        duplicate?: boolean;
        evidenceId: string;
        analysisId?: string;
    }>;
    onFailed(job: Job<EvidenceProcessingJobPayload>, error: Error): Promise<void>;
    onCompleted(job: Job<EvidenceProcessingJobPayload>): void;
}
