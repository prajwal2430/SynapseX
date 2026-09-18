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
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const job_queues_constant_1 = require("./constants/job-queues.constant");
let JobsService = JobsService_1 = class JobsService {
    constructor(evidenceQueue, aiQueue, reportQueue) {
        this.evidenceQueue = evidenceQueue;
        this.aiQueue = aiQueue;
        this.reportQueue = reportQueue;
        this.logger = new common_1.Logger(JobsService_1.name);
    }
    async enqueueEvidenceProcessing(payload, customOptions) {
        const options = {
            ...job_queues_constant_1.DEFAULT_JOB_OPTIONS,
            ...customOptions,
            jobId: `evidence-${payload.evidenceId}-${Date.now()}`,
        };
        const job = await this.evidenceQueue.add('process-evidence', payload, options);
        this.logger.log(`[BullMQ] Enqueued 'evidence-processing' job ${job.id} for evidence ${payload.evidenceId} (attempts: ${options.attempts}, backoff: exponential)`);
        return job;
    }
    async enqueueAiAnalysis(payload, customOptions) {
        const options = {
            ...job_queues_constant_1.DEFAULT_JOB_OPTIONS,
            ...customOptions,
            jobId: `ai-${payload.evidenceId}-${payload.analysisType}-${Date.now()}`,
        };
        const job = await this.aiQueue.add('analyze-evidence', payload, options);
        this.logger.log(`[BullMQ] Enqueued 'ai-analysis' job ${job.id} for evidence ${payload.evidenceId}`);
        return job;
    }
    async enqueueReportGeneration(payload, customOptions) {
        const options = {
            ...job_queues_constant_1.DEFAULT_JOB_OPTIONS,
            ...customOptions,
            jobId: `report-${payload.caseId}-${payload.reportType}-${Date.now()}`,
        };
        const job = await this.reportQueue.add('generate-report', payload, options);
        this.logger.log(`[BullMQ] Enqueued 'report-generation' job ${job.id} for case ${payload.caseId}`);
        return job;
    }
    async getJobStatus(queueName, jobId) {
        const queue = this.getQueueByName(queueName);
        const job = await queue.getJob(jobId);
        if (!job) {
            throw new common_1.NotFoundException(`Job with ID '${jobId}' not found in queue '${queueName}'`);
        }
        const state = await job.getState();
        return {
            id: job.id,
            queueName,
            name: job.name,
            state,
            progress: job.progress,
            attemptsMade: job.attemptsMade,
            maxAttempts: job.opts.attempts || 1,
            failedReason: job.failedReason || null,
            stacktrace: job.stacktrace || [],
            timestamp: job.timestamp,
            processedOn: job.processedOn || null,
            finishedOn: job.finishedOn || null,
            data: job.data,
        };
    }
    async getEvidenceJobStatus(evidenceId) {
        const jobs = await this.evidenceQueue.getJobs([
            'active',
            'waiting',
            'completed',
            'failed',
            'delayed',
        ]);
        const matchingJob = jobs
            .filter((j) => j.data?.evidenceId === evidenceId)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        if (!matchingJob) {
            return null;
        }
        const state = await matchingJob.getState();
        return {
            id: matchingJob.id,
            queueName: job_queues_constant_1.QUEUE_EVIDENCE_PROCESSING,
            name: matchingJob.name,
            state,
            progress: matchingJob.progress,
            attemptsMade: matchingJob.attemptsMade,
            maxAttempts: matchingJob.opts.attempts || 1,
            failedReason: matchingJob.failedReason || null,
            stacktrace: matchingJob.stacktrace || [],
            timestamp: matchingJob.timestamp,
            processedOn: matchingJob.processedOn || null,
            finishedOn: matchingJob.finishedOn || null,
            data: matchingJob.data,
        };
    }
    getQueueByName(queueName) {
        switch (queueName) {
            case job_queues_constant_1.QUEUE_EVIDENCE_PROCESSING:
                return this.evidenceQueue;
            case job_queues_constant_1.QUEUE_AI_ANALYSIS:
                return this.aiQueue;
            case job_queues_constant_1.QUEUE_REPORT_GENERATION:
                return this.reportQueue;
            default:
                throw new common_1.NotFoundException(`Unknown job queue '${queueName}'`);
        }
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(job_queues_constant_1.QUEUE_EVIDENCE_PROCESSING)),
    __param(1, (0, bullmq_1.InjectQueue)(job_queues_constant_1.QUEUE_AI_ANALYSIS)),
    __param(2, (0, bullmq_1.InjectQueue)(job_queues_constant_1.QUEUE_REPORT_GENERATION)),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue])
], JobsService);
//# sourceMappingURL=jobs.service.js.map