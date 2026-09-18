import { JobsOptions } from 'bullmq';
export declare const QUEUE_EVIDENCE_PROCESSING = "evidence-processing";
export declare const QUEUE_AI_ANALYSIS = "ai-analysis";
export declare const QUEUE_REPORT_GENERATION = "report-generation";
export declare const DEFAULT_JOB_RETRY_LIMIT = 3;
export declare const DEFAULT_BACKOFF_DELAY_MS = 2000;
export declare const DEFAULT_JOB_OPTIONS: JobsOptions;
export interface EvidenceProcessingJobPayload {
    evidenceId: string;
    caseId: string;
    storageBucket: string;
    storageKey: string;
    sha256: string;
    mimeType: string;
    fileSize: number;
    uploadedBy?: string;
    simulateFailure?: boolean;
}
export interface AiAnalysisJobPayload {
    evidenceId: string;
    caseId: string;
    analysisType: 'deep-triage' | 'malware-indicators' | 'network-flow' | 'timeline';
    parameters?: Record<string, any>;
    requestedBy: string;
}
export interface ReportGenerationJobPayload {
    caseId: string;
    reportType: 'forensic-summary' | 'chain-of-custody' | 'full-case-dossier';
    format: 'pdf' | 'json' | 'html';
    requestedBy: string;
}
