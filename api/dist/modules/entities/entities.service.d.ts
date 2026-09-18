import { Model } from 'mongoose';
import { EntityDocument } from './schemas/entity.schema';
import { CaseDocument } from '../cases/schemas/case.schema';
import { CreateEntityDto } from './dto/create-entity.dto';
import { EntityQueryDto } from './dto/entity-query.dto';
import { EntityResponseDto } from './dto/entity-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
export declare class EntitiesService {
    private readonly entityModel;
    private readonly caseModel;
    private readonly logger;
    constructor(entityModel: Model<EntityDocument>, caseModel: Model<CaseDocument>);
    findByCaseId(caseId: string, query: EntityQueryDto, currentUser: UserProfileDto): Promise<PaginatedResult<EntityResponseDto>>;
    findById(id: string, currentUser: UserProfileDto): Promise<EntityResponseDto>;
    upsertEntity(dto: CreateEntityDto): Promise<EntityDocument>;
    ingestExtractedEntities(caseId: string, evidenceId: string, defaultSource: string, rawEntities: Array<{
        entityType: string;
        entityValue: string;
        normalizedValue?: string;
        confidence?: number;
        context?: string;
        source?: string;
    }>): Promise<EntityDocument[]>;
    private mapRawTypeToEntityType;
    assertCanViewCase(caseDoc: CaseDocument, currentUser: UserProfileDto): void;
    private mapToResponse;
    private escapeRegex;
}
