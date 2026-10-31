import { JobsOptions } from 'bullmq';

export const QUEUE_EVIDENCE_PROCESSING = 'evidence-processing';
export const QUEUE_AI_ANALYSIS = 'ai-analysis';
export const QUEUE_REPORT_GENERATION = 'report-generation';

export const DEFAULT_JOB_RETRY_LIMIT = 3;
export const DEFAULT_BACKOFF_DELAY_MS = 2000;

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: DEFAULT_JOB_RETRY_LIMIT,
  backoff: {
    type: 'exponential',
    delay: DEFAULT_BACKOFF_DELAY_MS,
  },
  removeOnComplete: {
    age: 24 * 3600, // keep completed jobs for 24h
    count: 500,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // keep failed jobs for 7 days for forensic analysis
    count: 1000,
  },
};

export interface EvidenceProcessingJobPayload {
  evidenceId: string;
  caseId: string;
  storageBucket: string;
  storageKey: string;
  sha256: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string;
  simulateFailure?: boolean; // For dev worker retry verification
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
