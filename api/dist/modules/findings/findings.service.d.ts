import { Model } from 'mongoose';
import { FindingDocument } from './schemas/finding.schema';
import { CaseDocument } from '../cases/schemas/case.schema';
import { AuditService } from '../audit/audit.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { ReviewFindingDto } from './dto/review-finding.dto';
import { FindingQueryDto } from './dto/finding-query.dto';
import { FindingResponseDto } from './dto/finding-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { RealtimeEventsService } from '../realtime/services/realtime-events.service';
export declare class FindingsService {
    private readonly findingModel;
    private readonly caseModel;
    private readonly auditService;
    private readonly realtimeEventsService?;
    private readonly logger;
    constructor(findingModel: Model<FindingDocument>, caseModel: Model<CaseDocument>, auditService: AuditService, realtimeEventsService?: RealtimeEventsService);
    findByCaseId(caseId: string, query: FindingQueryDto, currentUser: UserProfileDto): Promise<PaginatedResult<FindingResponseDto>>;
    findById(id: string, currentUser: UserProfileDto): Promise<FindingResponseDto>;
    approveFinding(id: string, dto: ReviewFindingDto, currentUser: UserProfileDto, reqContext?: {
        ip?: string;
        userAgent?: string;
    }): Promise<FindingResponseDto>;
    rejectFinding(id: string, dto: ReviewFindingDto, currentUser: UserProfileDto, reqContext?: {
        ip?: string;
        userAgent?: string;
    }): Promise<FindingResponseDto>;
    createFinding(dto: CreateFindingDto): Promise<FindingDocument>;
    assertCanViewCase(caseDoc: CaseDocument, currentUser: UserProfileDto): void;
    private mapToResponse;
    private escapeRegex;
}
