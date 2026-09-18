export declare class TimelineEventResponseDto {
    id: string;
    caseId: string;
    evidenceId: string;
    timestamp: string;
    timezone: string;
    normalizedTimestamp: string;
    eventType: string;
    title: string;
    description: string;
    source: string;
    entities: Array<{
        entityType: string;
        entityValue: string;
        normalizedValue?: string;
        entityId?: string;
    }>;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
