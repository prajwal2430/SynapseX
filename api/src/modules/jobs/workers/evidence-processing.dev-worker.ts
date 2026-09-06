import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  QUEUE_EVIDENCE_PROCESSING,
  EvidenceProcessingJobPayload,
} from '../constants/job-queues.constant';
import { Evidence, EvidenceDocument } from '../../evidence/schemas/evidence.schema';
import {
  AnalysisResult,
  AnalysisResultDocument,
} from '../../evidence/schemas/analysis-result.schema';
import { ProcessingStatus } from '../../evidence/enums/processing-status.enum';
import {
  AI_SERVICE_CLIENT,
  IAiServiceClient,
} from '../../ai-client/interfaces/ai-service-client.interface';
import { EntitiesService } from '../../entities/entities.service';
import { GraphService } from '../../graph/graph.service';
import { RealtimeEventsService } from '../../realtime/services/realtime-events.service';

/**
 * ============================================================================
 * SynapseX Evidence Processing Worker
 * ============================================================================
 *
 * Architecture:
 * Evidence Upload ➔ NestJS API ➔ MongoDB ➔ BullMQ Job ➔ NestJS Worker
 * ➔ Python FastAPI AI Service ➔ Analysis Result ➔ NestJS Worker ➔ MongoDB
 * ➔ Neo4j Knowledge Graph Sync ➔ WebSocket Real-time Event Emissions
 *
 * Handles:
 * 1. Duplicate processing prevention & idempotency
 * 2. Status transitions: QUEUED ➔ PROCESSING ➔ COMPLETED (or FAILED)
 * 3. AI Service Client invocation with internal auth & timeouts
 * 4. Structured forensic analysis persistence in MongoDB
 * 5. Automatic entity normalization, deduplication & ingestion
 * 6. Neo4j Knowledge Graph synchronization
 * 7. Real-time WebSocket event broadcasts to case rooms
 * 8. Retry limits, exponential backoff, and comprehensive failure logging
 * ============================================================================
 */
@Processor(QUEUE_EVIDENCE_PROCESSING)
export class EvidenceProcessingDevWorker extends WorkerHost {
  private readonly logger = new Logger(EvidenceProcessingDevWorker.name);

  constructor(
    @InjectModel(Evidence.name)
    private readonly evidenceModel: Model<EvidenceDocument>,
    @InjectModel(AnalysisResult.name)
    private readonly analysisResultModel: Model<AnalysisResultDocument>,
    @Optional()
    @Inject(AI_SERVICE_CLIENT)
    private readonly aiServiceClient?: IAiServiceClient,
    @Optional()
    private readonly entitiesService?: EntitiesService,
    @Optional()
    private readonly graphService?: GraphService,
    @Optional()
    private readonly realtimeEventsService?: RealtimeEventsService,
  ) {
    super();
  }

  async process(
    job: Job<EvidenceProcessingJobPayload>,
  ): Promise<{ processed: boolean; duplicate?: boolean; evidenceId: string; analysisId?: string }> {
    const { evidenceId, caseId, sha256, simulateFailure } = job.data;
    const currentAttempt = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts || 1;

    this.logger.log(
      `[WORKER] Starting evidence processing job ${job.id} for evidence '${evidenceId}' (Attempt ${currentAttempt}/${maxAttempts})`,
    );

    // 1. Fetch evidence record
    const evidence = await this.evidenceModel.findById(evidenceId);
    if (!evidence) {
      this.logger.error(`[WORKER] Evidence record '${evidenceId}' not found in MongoDB`);
      throw new Error(`Evidence '${evidenceId}' does not exist`);
    }

    // 2. Prevent duplicate processing (Idempotency check)
    if (evidence.processingStatus === ProcessingStatus.COMPLETED) {
      const existingAnalysis = await this.analysisResultModel.findOne({
        evidenceId: evidence._id,
        status: 'COMPLETED',
      });
      if (existingAnalysis) {
        this.logger.warn(
          `[WORKER IDEMPOTENCY] Evidence '${evidenceId}' is already COMPLETED with analysis '${existingAnalysis._id}'. Skipping duplicate processing for job ${job.id}.`,
        );
        return {
          processed: false,
          duplicate: true,
          evidenceId,
          analysisId: existingAnalysis._id.toString(),
        };
      }
    }

    // 3. Transition status: QUEUED / PENDING ➔ PROCESSING
    evidence.processingStatus = ProcessingStatus.PROCESSING;
    await evidence.save();
    this.logger.log(`[WORKER] Evidence '${evidenceId}' status transitioned to PROCESSING`);

    const effectiveCaseId = evidence.caseId ? evidence.caseId.toString() : caseId;
    this.realtimeEventsService?.emitEvidenceProcessing(effectiveCaseId, {
      evidenceId: evidence._id.toString(),
      filename: evidence.originalFilename,
      status: ProcessingStatus.PROCESSING,
      jobId: String(job.id),
    });

    // 4. Backward-compatible hook for testing retry limits and backoff
    if (simulateFailure) {
      this.logger.warn(
        `[WORKER] Triggering intentional failure for job ${job.id} (Attempt ${currentAttempt}/${maxAttempts})`,
      );
      throw new Error(
        `Simulated processing error for retry validation: Attempt ${currentAttempt}/${maxAttempts}`,
      );
    }

    // 5. Invoke Python FastAPI AI Service if client is available
    let analysisDocId: string | undefined;
    if (this.aiServiceClient) {
      this.realtimeEventsService?.emitAnalysisStarted(effectiveCaseId, {
        evidenceId: evidence._id.toString(),
        service: 'fastapi-ai-service',
      });

      this.logger.log(
        `[WORKER] Calling Python FastAPI AI Service for evidence '${evidenceId}' (file: '${evidence.originalFilename}')`,
      );

      const aiResponse = await this.aiServiceClient.analyzeEvidence({
        caseId: evidence.caseId ? evidence.caseId.toString() : caseId,
        evidenceId: evidence._id.toString(),
        fileName: evidence.originalFilename,
        mimeType: evidence.mimeType,
        fileSize: evidence.fileSize,
        sha256: evidence.sha256,
        metadata: evidence.metadata || {},
        contentText: typeof evidence.metadata?.contentText === 'string' ? evidence.metadata.contentText : undefined,
      });

      // 6. Store structured analysis results in MongoDB
      const analysisDoc = new this.analysisResultModel({
        caseId: evidence.caseId,
        evidenceId: evidence._id,
        jobId: String(job.id),
        status: 'COMPLETED',
        entities: aiResponse.entities,
        entityCounts: aiResponse.entityCounts,
        totalEntities: aiResponse.totalEntities,
        executionTimeMs: aiResponse.executionTimeMs,
        metadata: {
          fileName: aiResponse.fileName,
          analyzedAt: new Date(),
        },
      });

      const savedAnalysis = await analysisDoc.save();
      analysisDocId = savedAnalysis._id.toString();

      this.logger.log(
        `[WORKER] Successfully stored structured analysis '${analysisDocId}' for evidence '${evidenceId}' (${aiResponse.totalEntities} entities identified)`,
      );

      // Link analysis result in evidence metadata
      evidence.metadata = {
        ...evidence.metadata,
        latestAnalysisId: savedAnalysis._id,
      };

      this.realtimeEventsService?.emitEvidenceProgress(effectiveCaseId, {
        evidenceId: evidence._id.toString(),
        progress: 40,
        stage: 'AI_ANALYSIS_COMPLETED',
        details: { totalEntities: aiResponse.totalEntities },
      });

      // 7. Normalize, deduplicate & persist forensic entities
      if (this.entitiesService && aiResponse.entities && aiResponse.entities.length > 0) {
        try {
          await this.entitiesService.ingestExtractedEntities(
            evidence.caseId.toString(),
            evidence._id.toString(),
            evidence.originalFilename,
            aiResponse.entities.map((e) => ({
              entityType: e.entityType,
              entityValue: e.entityValue,
              normalizedValue: e.normalizedValue,
              confidence: e.confidence,
              context: e.context,
              source: evidence.originalFilename,
            })),
          );

          this.realtimeEventsService?.emitEvidenceProgress(effectiveCaseId, {
            evidenceId: evidence._id.toString(),
            progress: 75,
            stage: 'ENTITIES_INGESTED',
          });
        } catch (err: any) {
          this.logger.warn(
            `[WORKER] Non-fatal entity ingestion warning for evidence '${evidenceId}': ${err.message}`,
          );
        }
      }

      // 8. Synchronize evidence and entities to Neo4j Knowledge Graph
      if (this.graphService && aiResponse.entities && aiResponse.entities.length > 0) {
        try {
          await this.graphService.syncEvidenceEntities(
            evidence.caseId.toString(),
            evidence._id.toString(),
            evidence.originalFilename,
            aiResponse.entities.map((e) => ({
              type: e.entityType,
              value: e.entityValue,
              normalizedValue: e.normalizedValue,
              confidence: e.confidence,
              source: evidence.originalFilename,
            })),
          );

          this.realtimeEventsService?.emitEvidenceProgress(effectiveCaseId, {
            evidenceId: evidence._id.toString(),
            progress: 90,
            stage: 'GRAPH_SYNCHRONIZED',
          });
        } catch (err: any) {
          this.logger.warn(
            `[WORKER] Non-fatal graph sync warning for evidence '${evidenceId}': ${err.message}`,
          );
        }
      }
    }

    // 9. Transition status to COMPLETED
    evidence.processingStatus = ProcessingStatus.COMPLETED;
    await evidence.save();
    this.logger.log(`[WORKER] Evidence '${evidenceId}' status transitioned to COMPLETED`);

    this.realtimeEventsService?.emitEvidenceCompleted(effectiveCaseId, {
      evidenceId: evidence._id.toString(),
      analysisId: analysisDocId,
      status: ProcessingStatus.COMPLETED,
      sha256: evidence.sha256,
    });

    if (analysisDocId) {
      this.realtimeEventsService?.emitAnalysisCompleted(effectiveCaseId, {
        evidenceId: evidence._id.toString(),
        analysisId: analysisDocId,
      });
    }

    return {
      processed: true,
      evidenceId,
      analysisId: analysisDocId,
    };
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<EvidenceProcessingJobPayload>, error: Error): Promise<void> {
    const { evidenceId, caseId } = job.data;
    const maxAttempts = job.opts.attempts || 1;
    const isExhausted = job.attemptsMade >= maxAttempts;

    this.logger.warn(
      `[WORKER FAILURE] Job ${job.id} for evidence '${evidenceId}' failed on attempt ${job.attemptsMade}/${maxAttempts}: ${error.message}`,
    );

    this.realtimeEventsService?.emitEvidenceFailed(caseId, {
      evidenceId,
      error: error.message,
      attemptsMade: job.attemptsMade,
    });

    if (isExhausted) {
      this.logger.error(
        `[WORKER RETRIES EXHAUSTED] All ${maxAttempts} retry attempts exhausted for job ${job.id}. Marking evidence '${evidenceId}' as FAILED.`,
      );

      this.realtimeEventsService?.emitAnalysisFailed(caseId, {
        evidenceId,
        error: error.message,
      });

      try {
        await this.evidenceModel.findByIdAndUpdate(evidenceId, {
          processingStatus: ProcessingStatus.FAILED,
        });

        // Store failure analysis record for investigation tracking
        await this.analysisResultModel.create({
          caseId,
          evidenceId,
          jobId: String(job.id),
          status: 'FAILED',
          error: error.message,
          totalEntities: 0,
          entityCounts: {},
          entities: [],
          executionTimeMs: 0,
        });
      } catch (err) {
        this.logger.error(`Failed to update evidence status to FAILED or save failure record: ${err.message}`);
      }
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<EvidenceProcessingJobPayload>): void {
    this.logger.log(
      `[WORKER COMPLETED] Successfully finished job ${job.id} for evidence '${job.data.evidenceId}'`,
    );
  }
}
