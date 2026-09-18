import { EntitiesService } from './entities.service';
import { EntityQueryDto } from './dto/entity-query.dto';
import { EntityResponseDto } from './dto/entity-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
export declare class EntitiesController {
    private readonly entitiesService;
    constructor(entitiesService: EntitiesService);
    findByCase(caseId: string, query: EntityQueryDto, currentUser: UserProfileDto): Promise<PaginatedResult<EntityResponseDto>>;
    findById(id: string, currentUser: UserProfileDto): Promise<EntityResponseDto>;
}
