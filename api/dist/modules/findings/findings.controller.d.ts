import { FindingsService } from './findings.service';
import { ReviewFindingDto } from './dto/review-finding.dto';
import { FindingQueryDto } from './dto/finding-query.dto';
import { FindingResponseDto } from './dto/finding-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
export declare class FindingsController {
    private readonly findingsService;
    constructor(findingsService: FindingsService);
    approve(id: string, dto: ReviewFindingDto, currentUser: UserProfileDto, ipAddress: string, userAgent?: string): Promise<FindingResponseDto>;
    reject(id: string, dto: ReviewFindingDto, currentUser: UserProfileDto, ipAddress: string, userAgent?: string): Promise<FindingResponseDto>;
    findByCase(caseId: string, query: FindingQueryDto, currentUser: UserProfileDto): Promise<PaginatedResult<FindingResponseDto>>;
    findById(id: string, currentUser: UserProfileDto): Promise<FindingResponseDto>;
}
