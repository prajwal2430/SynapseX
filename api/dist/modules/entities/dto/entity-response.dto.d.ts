import { EntityType } from '../enums/entity-type.enum';
export declare class EntityResponseDto {
    id: string;
    caseId: string;
    evidenceId: string;
    type: EntityType;
    value: string;
    normalizedValue: string;
    confidence: number;
    source: string;
    extractionMethod: string;
    evidenceStrength: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
