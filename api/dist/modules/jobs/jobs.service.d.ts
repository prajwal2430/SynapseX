import { Queue, Job, JobsOptions } from 'bullmq';
import { EvidenceProcessingJobPayload, AiAnalysisJobPayload, ReportGenerationJobPayload } from './constants/job-queues.constant';
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
export declare class JobsService {
    private readonly evidenceQueue;
    private readonly aiQueue;
    private readonly reportQueue;
    private readonly logger;
    constructor(evidenceQueue: Queue, aiQueue: Queue, reportQueue: Queue);
    enqueueEvidenceProcessing(payload: EvidenceProcessingJobPayload, customOptions?: Partial<JobsOptions>): Promise<Job<EvidenceProcessingJobPayload>>;
    enqueueAiAnalysis(payload: AiAnalysisJobPayload, customOptions?: Partial<JobsOptions>): Promise<Job<AiAnalysisJobPayload>>;
    enqueueReportGeneration(payload: ReportGenerationJobPayload, customOptions?: Partial<JobsOptions>): Promise<Job<ReportGenerationJobPayload>>;
    getJobStatus(queueName: string, jobId: string): Promise<JobStatusResponse>;
    getEvidenceJobStatus(evidenceId: string): Promise<JobStatusResponse | null>;
    private getQueueByName;
}
