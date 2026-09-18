export declare const REALTIME_EVENTS: {
    readonly EVIDENCE_PROCESSING: "evidence:processing";
    readonly EVIDENCE_PROGRESS: "evidence:progress";
    readonly EVIDENCE_COMPLETED: "evidence:completed";
    readonly EVIDENCE_FAILED: "evidence:failed";
    readonly ANALYSIS_STARTED: "analysis:started";
    readonly ANALYSIS_COMPLETED: "analysis:completed";
    readonly ANALYSIS_FAILED: "analysis:failed";
    readonly FINDING_CREATED: "finding:created";
    readonly REPORT_GENERATED: "report:generated";
    readonly JOIN_CASE: "join:case";
    readonly LEAVE_CASE: "leave:case";
};
export declare function getCaseRoom(caseId: string): string;
