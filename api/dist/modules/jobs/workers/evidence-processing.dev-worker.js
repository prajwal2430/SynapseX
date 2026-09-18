"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EvidenceProcessingDevWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceProcessingDevWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const job_queues_constant_1 = require("../constants/job-queues.constant");
const evidence_schema_1 = require("../../evidence/schemas/evidence.schema");
const analysis_result_schema_1 = require("../../evidence/schemas/analysis-result.schema");
const processing_status_enum_1 = require("../../evidence/enums/processing-status.enum");
const ai_service_client_interface_1 = require("../../ai-client/interfaces/ai-service-client.interface");
const entities_service_1 = require("../../entities/entities.service");
const graph_service_1 = require("../../graph/graph.service");
const realtime_events_service_1 = require("../../realtime/services/realtime-events.service");
let EvidenceProcessingDevWorker = EvidenceProcessingDevWorker_1 = class EvidenceProcessingDevWorker extends bullmq_1.WorkerHost {
    constructor(evidenceModel, analysisResultModel, aiServiceClient, entitiesService, graphService, realtimeEventsService) {
        super();
        this.evidenceModel = evidenceModel;
        this.analysisResultModel = analysisResultModel;
        this.aiServiceClient = aiServiceClient;
        this.entitiesService = entitiesService;
        this.graphService = graphService;
        this.realtimeEventsService = realtimeEventsService;
        this.logger = new common_1.Logger(EvidenceProcessingDevWorker_1.name);
    }
    async process(job) {
        const { evidenceId, caseId, sha256, simulateFailure } = job.data;
        const currentAttempt = job.attemptsMade + 1;
        const maxAttempts = job.opts.attempts || 1;
        this.logger.log(`[WORKER] Starting evidence processing job ${job.id} for evidence '${evidenceId}' (Attempt ${currentAttempt}/${maxAttempts})`);
        const evidence = await this.evidenceModel.findById(evidenceId);
        if (!evidence) {
            this.logger.error(`[WORKER] Evidence record '${evidenceId}' not found in MongoDB`);
            throw new Error(`Evidence '${evidenceId}' does not exist`);
        }
        if (evidence.processingStatus === processing_status_enum_1.ProcessingStatus.COMPLETED) {
            const existingAnalysis = await this.analysisResultModel.findOne({
                evidenceId: evidence._id,
                status: 'COMPLETED',
            });
            if (existingAnalysis) {
                this.logger.warn(`[WORKER IDEMPOTENCY] Evidence '${evidenceId}' is already COMPLETED with analysis '${existingAnalysis._id}'. Skipping duplicate processing for job ${job.id}.`);
                return {
                    processed: false,
                    duplicate: true,
                    evidenceId,
                    analysisId: existingAnalysis._id.toString(),
                };
            }
        }
        evidence.processingStatus = processing_status_enum_1.ProcessingStatus.PROCESSING;
        await evidence.save();
        this.logger.log(`[WORKER] Evidence '${evidenceId}' status transitioned to PROCESSING`);
        const effectiveCaseId = evidence.caseId ? evidence.caseId.toString() : caseId;
        this.realtimeEventsService?.emitEvidenceProcessing(effectiveCaseId, {
            evidenceId: evidence._id.toString(),
            filename: evidence.originalFilename,
            status: processing_status_enum_1.ProcessingStatus.PROCESSING,
            jobId: String(job.id),
        });
        if (simulateFailure) {
            this.logger.warn(`[WORKER] Triggering intentional failure for job ${job.id} (Attempt ${currentAttempt}/${maxAttempts})`);
            throw new Error(`Simulated processing error for retry validation: Attempt ${currentAttempt}/${maxAttempts}`);
        }
        let analysisDocId;
        if (this.aiServiceClient) {
            this.realtimeEventsService?.emitAnalysisStarted(effectiveCaseId, {
                evidenceId: evidence._id.toString(),
                service: 'fastapi-ai-service',
            });
            this.logger.log(`[WORKER] Calling Python FastAPI AI Service for evidence '${evidenceId}' (file: '${evidence.originalFilename}')`);
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
            this.logger.log(`[WORKER] Successfully stored structured analysis '${analysisDocId}' for evidence '${evidenceId}' (${aiResponse.totalEntities} entities identified)`);
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
            if (this.entitiesService && aiResponse.entities && aiResponse.entities.length > 0) {
                try {
                    await this.entitiesService.ingestExtractedEntities(evidence.caseId.toString(), evidence._id.toString(), evidence.originalFilename, aiResponse.entities.map((e) => ({
                        entityType: e.entityType,
                        entityValue: e.entityValue,
                        normalizedValue: e.normalizedValue,
                        confidence: e.confidence,
                        context: e.context,
                        source: evidence.originalFilename,
                    })));
                    this.realtimeEventsService?.emitEvidenceProgress(effectiveCaseId, {
                        evidenceId: evidence._id.toString(),
                        progress: 75,
                        stage: 'ENTITIES_INGESTED',
                    });
                }
                catch (err) {
                    this.logger.warn(`[WORKER] Non-fatal entity ingestion warning for evidence '${evidenceId}': ${err.message}`);
                }
            }
            if (this.graphService && aiResponse.entities && aiResponse.entities.length > 0) {
                try {
                    await this.graphService.syncEvidenceEntities(evidence.caseId.toString(), evidence._id.toString(), evidence.originalFilename, aiResponse.entities.map((e) => ({
                        type: e.entityType,
                        value: e.entityValue,
                        normalizedValue: e.normalizedValue,
                        confidence: e.confidence,
                        source: evidence.originalFilename,
                    })));
                    this.realtimeEventsService?.emitEvidenceProgress(effectiveCaseId, {
                        evidenceId: evidence._id.toString(),
                        progress: 90,
                        stage: 'GRAPH_SYNCHRONIZED',
                    });
                }
                catch (err) {
                    this.logger.warn(`[WORKER] Non-fatal graph sync warning for evidence '${evidenceId}': ${err.message}`);
                }
            }
        }
        evidence.processingStatus = processing_status_enum_1.ProcessingStatus.COMPLETED;
        await evidence.save();
        this.logger.log(`[WORKER] Evidence '${evidenceId}' status transitioned to COMPLETED`);
        this.realtimeEventsService?.emitEvidenceCompleted(effectiveCaseId, {
            evidenceId: evidence._id.toString(),
            analysisId: analysisDocId,
            status: processing_status_enum_1.ProcessingStatus.COMPLETED,
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
    async onFailed(job, error) {
        const { evidenceId, caseId } = job.data;
        const maxAttempts = job.opts.attempts || 1;
        const isExhausted = job.attemptsMade >= maxAttempts;
        this.logger.warn(`[WORKER FAILURE] Job ${job.id} for evidence '${evidenceId}' failed on attempt ${job.attemptsMade}/${maxAttempts}: ${error.message}`);
        this.realtimeEventsService?.emitEvidenceFailed(caseId, {
            evidenceId,
            error: error.message,
            attemptsMade: job.attemptsMade,
        });
        if (isExhausted) {
            this.logger.error(`[WORKER RETRIES EXHAUSTED] All ${maxAttempts} retry attempts exhausted for job ${job.id}. Marking evidence '${evidenceId}' as FAILED.`);
            this.realtimeEventsService?.emitAnalysisFailed(caseId, {
                evidenceId,
                error: error.message,
            });
            try {
                await this.evidenceModel.findByIdAndUpdate(evidenceId, {
                    processingStatus: processing_status_enum_1.ProcessingStatus.FAILED,
                });
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
            }
            catch (err) {
                this.logger.error(`Failed to update evidence status to FAILED or save failure record: ${err.message}`);
            }
        }
    }
    onCompleted(job) {
        this.logger.log(`[WORKER COMPLETED] Successfully finished job ${job.id} for evidence '${job.data.evidenceId}'`);
    }
};
exports.EvidenceProcessingDevWorker = EvidenceProcessingDevWorker;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", Promise)
], EvidenceProcessingDevWorker.prototype, "onFailed", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], EvidenceProcessingDevWorker.prototype, "onCompleted", null);
exports.EvidenceProcessingDevWorker = EvidenceProcessingDevWorker = EvidenceProcessingDevWorker_1 = __decorate([
    (0, bullmq_1.Processor)(job_queues_constant_1.QUEUE_EVIDENCE_PROCESSING),
    __param(0, (0, mongoose_1.InjectModel)(evidence_schema_1.Evidence.name)),
    __param(1, (0, mongoose_1.InjectModel)(analysis_result_schema_1.AnalysisResult.name)),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)(ai_service_client_interface_1.AI_SERVICE_CLIENT)),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model, Object, entities_service_1.EntitiesService,
        graph_service_1.GraphService,
        realtime_events_service_1.RealtimeEventsService])
], EvidenceProcessingDevWorker);
//# sourceMappingURL=evidence-processing.dev-worker.js.map