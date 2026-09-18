import { EntityType } from '../enums/entity-type.enum';
export declare class EntityQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    type?: EntityType;
    evidenceId?: string;
    minConfidence?: number;
    source?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
