import { EventsGateway } from '../gateways/events.gateway';
export interface BaseEventPayload {
    caseId: string;
    timestamp: string;
    [key: string]: any;
}
export interface EvidenceProcessingPayload {
    evidenceId: string;
    filename?: string;
    status: string;
    jobId?: string;
}
export interface EvidenceProgressPayload {
    evidenceId: string;
    progress: number;
    stage: string;
    details?: Record<string, any>;
}
export interface EvidenceCompletedPayload {
    evidenceId: string;
    analysisId?: string;
    status: string;
    sha256?: string;
}
export interface EvidenceFailedPayload {
    evidenceId: string;
    error: string;
    attemptsMade?: number;
}
export interface AnalysisStartedPayload {
    evidenceId: string;
    analysisId?: string;
    service?: string;
}
export interface AnalysisCompletedPayload {
    evidenceId: string;
    analysisId?: string;
    entitiesCount?: number;
    confidence?: number;
}
export interface AnalysisFailedPayload {
    evidenceId: string;
    error: string;
}
export interface FindingCreatedPayload {
    findingId: string;
    title: string;
    findingType: string;
    confidenceScore: number;
    generatedBy?: string;
}
export interface ReportGeneratedPayload {
    reportId: string;
    title: string;
    format: string;
    generatedBy?: string;
}
export declare class RealtimeEventsService {
    private readonly eventsGateway;
    private readonly logger;
    constructor(eventsGateway: EventsGateway);
    private emitToCase;
    emitEvidenceProcessing(caseId: string, payload: EvidenceProcessingPayload): void;
    emitEvidenceProgress(caseId: string, payload: EvidenceProgressPayload): void;
    emitEvidenceCompleted(caseId: string, payload: EvidenceCompletedPayload): void;
    emitEvidenceFailed(caseId: string, payload: EvidenceFailedPayload): void;
    emitAnalysisStarted(caseId: string, payload: AnalysisStartedPayload): void;
    emitAnalysisCompleted(caseId: string, payload: AnalysisCompletedPayload): void;
    emitAnalysisFailed(caseId: string, payload: AnalysisFailedPayload): void;
    emitFindingCreated(caseId: string, payload: FindingCreatedPayload): void;
    emitReportGenerated(caseId: string, payload: ReportGeneratedPayload): void;
}
