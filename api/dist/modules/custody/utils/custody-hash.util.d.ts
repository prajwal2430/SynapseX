export interface CustodyHashPayload {
    evidenceId: string;
    caseId: string;
    action: string;
    actorId: string;
    timestamp: string | Date;
    sequenceNumber: number;
    previousRecordHash: string;
    metadata?: Record<string, any>;
}
export declare function canonicalStringify(obj: any): string;
export declare function computeCustodyRecordHash(payload: CustodyHashPayload): string;
