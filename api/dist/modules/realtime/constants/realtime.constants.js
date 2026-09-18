"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REALTIME_EVENTS = void 0;
exports.getCaseRoom = getCaseRoom;
exports.REALTIME_EVENTS = {
    EVIDENCE_PROCESSING: 'evidence:processing',
    EVIDENCE_PROGRESS: 'evidence:progress',
    EVIDENCE_COMPLETED: 'evidence:completed',
    EVIDENCE_FAILED: 'evidence:failed',
    ANALYSIS_STARTED: 'analysis:started',
    ANALYSIS_COMPLETED: 'analysis:completed',
    ANALYSIS_FAILED: 'analysis:failed',
    FINDING_CREATED: 'finding:created',
    REPORT_GENERATED: 'report:generated',
    JOIN_CASE: 'join:case',
    LEAVE_CASE: 'leave:case',
};
function getCaseRoom(caseId) {
    return `case:${caseId}`;
}
//# sourceMappingURL=realtime.constants.js.map