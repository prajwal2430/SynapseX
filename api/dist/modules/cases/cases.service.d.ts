import { Model } from 'mongoose';
import { CaseDocument } from './schemas/case.schema';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseQueryDto } from './dto/case-query.dto';
import { CaseResponseDto, DeleteCaseResponseDto } from './dto/case-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
export declare class CasesService {
    private readonly caseModel;
    private readonly logger;
    constructor(caseModel: Model<CaseDocument>);
    create(createCaseDto: CreateCaseDto, creator: UserProfileDto): Promise<CaseResponseDto>;
    findAll(query: CaseQueryDto): Promise<PaginatedResult<CaseResponseDto>>;
    findById(id: string): Promise<CaseResponseDto>;
    update(id: string, updateCaseDto: UpdateCaseDto, currentUser: UserProfileDto): Promise<CaseResponseDto>;
    delete(id: string, currentUser: UserProfileDto): Promise<DeleteCaseResponseDto>;
    private assertCanManageCase;
    private generateCaseNumber;
    private mapToCaseResponse;
}
