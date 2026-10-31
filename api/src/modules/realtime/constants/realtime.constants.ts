/**
 * Real-time event names emitted by SynapseX WebSocket Gateway
 */
export const REALTIME_EVENTS = {
  // Evidence Processing Lifecycle
  EVIDENCE_PROCESSING: 'evidence:processing',
  EVIDENCE_PROGRESS: 'evidence:progress',
  EVIDENCE_COMPLETED: 'evidence:completed',
  EVIDENCE_FAILED: 'evidence:failed',

  // AI Analysis Lifecycle
  ANALYSIS_STARTED: 'analysis:started',
  ANALYSIS_COMPLETED: 'analysis:completed',
  ANALYSIS_FAILED: 'analysis:failed',

  // Forensic Findings
  FINDING_CREATED: 'finding:created',

  // Report Generation
  REPORT_GENERATED: 'report:generated',

  // Client Room Subscription Actions
  JOIN_CASE: 'join:case',
  LEAVE_CASE: 'leave:case',
} as const;

/**
 * Generates the standardized room identifier for a case.
 */
export function getCaseRoom(caseId: string): string {
  return `case:${caseId}`;
}
