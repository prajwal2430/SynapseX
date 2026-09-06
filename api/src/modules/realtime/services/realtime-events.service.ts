import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from '../gateways/events.gateway';
import { REALTIME_EVENTS, getCaseRoom } from '../constants/realtime.constants';

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

@Injectable()
export class RealtimeEventsService {
  private readonly logger = new Logger(RealtimeEventsService.name);

  constructor(private readonly eventsGateway: EventsGateway) {}

  /**
   * Internal helper to broadcast scoped events strictly to the case room.
   * NEVER broadcasts sensitive case information globally.
   */
  private emitToCase<T extends Record<string, any>>(
    caseId: string,
    event: string,
    payload: T,
  ): void {
    if (!this.eventsGateway.server) {
      this.logger.debug(
        `[WS EVENT SKIPPED] WebSocket server not ready. Event: ${event} for case ${caseId}`,
      );
      return;
    }

    const room = getCaseRoom(caseId);
    const enrichedPayload: BaseEventPayload = {
      caseId,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    this.eventsGateway.server.to(room).emit(event, enrichedPayload);
    this.logger.debug(`[WS BROADCAST] Emitted '${event}' to room '${room}'`);
  }

  // ==========================================
  // Evidence Processing Lifecycle Events
  // ==========================================

  emitEvidenceProcessing(caseId: string, payload: EvidenceProcessingPayload): void {
    this.emitToCase(caseId, REALTIME_EVENTS.EVIDENCE_PROCESSING, payload);
  }

  emitEvidenceProgress(caseId: string, payload: EvidenceProgressPayload): void {
    this.emitToCase(caseId, REALTIME_EVENTS.EVIDENCE_PROGRESS, payload);
  }

  emitEvidenceCompleted(caseId: string, payload: EvidenceCompletedPayload): void {
    this.emitToCase(caseId, REALTIME_EVENTS.EVIDENCE_COMPLETED, payload);
  }

  emitEvidenceFailed(caseId: string, payload: EvidenceFailedPayload): void {
    this.emitToCase(caseId, REALTIME_EVENTS.EVIDENCE_FAILED, payload);
  }

  // ==========================================
  // AI Analysis Lifecycle Events
  // ==========================================

  emitAnalysisStarted(caseId: string, payload: AnalysisStartedPayload): void {
    this.emitToCase(caseId, REALTIME_EVENTS.ANALYSIS_STARTED, payload);
  }

  emitAnalysisCompleted(caseId: string, payload: AnalysisCompletedPayload): void {
    this.emitToCase(caseId, REALTIME_EVENTS.ANALYSIS_COMPLETED, payload);
  }

  emitAnalysisFailed(caseId: string, payload: AnalysisFailedPayload): void {
    this.emitToCase(caseId, REALTIME_EVENTS.ANALYSIS_FAILED, payload);
  }

  // ==========================================
  // Forensic Findings Events
  // ==========================================

  emitFindingCreated(caseId: string, payload: FindingCreatedPayload): void {
    this.emitToCase(caseId, REALTIME_EVENTS.FINDING_CREATED, payload);
  }

  // ==========================================
  // Report Generation Events
  // ==========================================

  emitReportGenerated(caseId: string, payload: ReportGeneratedPayload): void {
    this.emitToCase(caseId, REALTIME_EVENTS.REPORT_GENERATED, payload);
  }
}
