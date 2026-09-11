import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job, JobsOptions } from 'bullmq';
import {
  QUEUE_EVIDENCE_PROCESSING,
  QUEUE_AI_ANALYSIS,
  QUEUE_REPORT_GENERATION,
  DEFAULT_JOB_OPTIONS,
  EvidenceProcessingJobPayload,
  AiAnalysisJobPayload,
  ReportGenerationJobPayload,
} from './constants/job-queues.constant';

export interface JobStatusResponse {
  id: string;
  queueName: string;
  name: string;
  state: string;
  progress: number | object | string | boolean;
  attemptsMade: number;
  maxAttempts: number;
  failedReason?: string | null;
  stacktrace?: string[];
  timestamp: number;
  processedOn?: number | null;
  finishedOn?: number | null;
  data: any;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue(QUEUE_EVIDENCE_PROCESSING)
    private readonly evidenceQueue: Queue,
    @InjectQueue(QUEUE_AI_ANALYSIS)
    private readonly aiQueue: Queue,
    @InjectQueue(QUEUE_REPORT_GENERATION)
    private readonly reportQueue: Queue,
  ) {}

  /**
   * Dispatches an evidence-processing job with retry limits (3) and exponential backoff (2000ms).
   * Executes asynchronously without blocking HTTP response flow.
   */
  async enqueueEvidenceProcessing(
    payload: EvidenceProcessingJobPayload,
    customOptions?: Partial<JobsOptions>,
  ): Promise<Job<EvidenceProcessingJobPayload>> {
    const options: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...customOptions,
      jobId: `evidence-${payload.evidenceId}-${Date.now()}`,
    };

    const job = await this.evidenceQueue.add(
      'process-evidence',
      payload,
      options,
    );

    this.logger.log(
      `[BullMQ] Enqueued 'evidence-processing' job ${job.id} for evidence ${payload.evidenceId} (attempts: ${options.attempts}, backoff: exponential)`,
    );

    return job;
  }

  /**
   * Dispatches an AI analysis job to the ai-analysis queue.
   */
  async enqueueAiAnalysis(
    payload: AiAnalysisJobPayload,
    customOptions?: Partial<JobsOptions>,
  ): Promise<Job<AiAnalysisJobPayload>> {
    const options: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...customOptions,
      jobId: `ai-${payload.evidenceId}-${payload.analysisType}-${Date.now()}`,
    };

    const job = await this.aiQueue.add('analyze-evidence', payload, options);
    this.logger.log(`[BullMQ] Enqueued 'ai-analysis' job ${job.id} for evidence ${payload.evidenceId}`);
    return job;
  }

  /**
   * Dispatches a report-generation job to the report-generation queue.
   */
  async enqueueReportGeneration(
    payload: ReportGenerationJobPayload,
    customOptions?: Partial<JobsOptions>,
  ): Promise<Job<ReportGenerationJobPayload>> {
    const options: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...customOptions,
      jobId: `report-${payload.caseId}-${payload.reportType}-${Date.now()}`,
    };

    const job = await this.reportQueue.add('generate-report', payload, options);
    this.logger.log(`[BullMQ] Enqueued 'report-generation' job ${job.id} for case ${payload.caseId}`);
    return job;
  }

  /**
   * Tracks and inspects the status of any job across the registered queues.
   */
  async getJobStatus(queueName: string, jobId: string): Promise<JobStatusResponse> {
    const queue = this.getQueueByName(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job with ID '${jobId}' not found in queue '${queueName}'`);
    }

    const state = await job.getState();

    return {
      id: job.id!,
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

  /**
   * Finds the latest processing job associated with an evidence artifact.
   */
  async getEvidenceJobStatus(evidenceId: string): Promise<JobStatusResponse | null> {
    // Search across active, waiting, completed, and failed jobs
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
      id: matchingJob.id!,
      queueName: QUEUE_EVIDENCE_PROCESSING,
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

  private getQueueByName(queueName: string): Queue {
    switch (queueName) {
      case QUEUE_EVIDENCE_PROCESSING:
        return this.evidenceQueue;
      case QUEUE_AI_ANALYSIS:
        return this.aiQueue;
      case QUEUE_REPORT_GENERATION:
        return this.reportQueue;
      default:
        throw new NotFoundException(`Unknown job queue '${queueName}'`);
    }
  }
}
