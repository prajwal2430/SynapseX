import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseQueryDto } from './dto/case-query.dto';
import { CaseResponseDto, DeleteCaseResponseDto } from './dto/case-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
export declare class CasesController {
    private readonly casesService;
    constructor(casesService: CasesService);
    create(createCaseDto: CreateCaseDto, currentUser: UserProfileDto): Promise<CaseResponseDto>;
    findAll(query: CaseQueryDto): Promise<PaginatedResult<CaseResponseDto>>;
    findById(id: string): Promise<CaseResponseDto>;
    update(id: string, updateCaseDto: UpdateCaseDto, currentUser: UserProfileDto): Promise<CaseResponseDto>;
    delete(id: string, currentUser: UserProfileDto): Promise<DeleteCaseResponseDto>;
}
