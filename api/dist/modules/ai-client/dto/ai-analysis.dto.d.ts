export interface ExtractedEntityDto {
    entityType: string;
    entityValue: string;
    normalizedValue: string;
    confidence: number;
    evidenceId?: string;
    eventId?: string | number;
    context?: string;
}
export interface AiEvidenceAnalysisRequestDto {
    caseId: string;
    evidenceId: string;
    fileName: string;
    mimeType?: string;
    fileSize?: number;
    sha256?: string;
    metadata?: Record<string, any>;
    contentText?: string;
    rawEvents?: Array<Record<string, any>>;
}
export interface AiEvidenceAnalysisResponseDto {
    caseId: string;
    evidenceId: string;
    fileName: string;
    entities: ExtractedEntityDto[];
    entityCounts: Record<string, number>;
    totalEntities: number;
    executionTimeMs: number;
}
export interface AiTimelineAnalysisRequestDto {
    caseId: string;
    events: Array<Record<string, any>>;
    windowSeconds?: number;
}
export interface AiTimelineAnalysisResponseDto {
    caseId: string;
    timeline: Array<{
        eventId?: string | number;
        evidenceId?: string | number;
        timestamp?: string;
        source?: string;
        eventType: string;
        description: string;
        entities: ExtractedEntityDto[];
    }>;
    clusters: Array<Record<string, any>>;
    totalEvents: number;
    temporalRange: Record<string, any>;
    executionTimeMs: number;
}
export interface AiCorrelationAnalysisRequestDto {
    caseId: string;
    extractedEntities?: ExtractedEntityDto[];
    timeline?: Array<Record<string, any>>;
    rawEvents?: Array<Record<string, any>>;
}
export interface AiCorrelationAnalysisResponseDto {
    caseId: string;
    correlations: Array<Record<string, any>>;
    totalCorrelations: number;
    highConfidenceCount: number;
    disclaimer: string;
    executionTimeMs: number;
}
