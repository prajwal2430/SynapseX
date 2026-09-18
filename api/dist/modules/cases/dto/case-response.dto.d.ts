import { CaseStatus } from '../enums/case-status.enum';
import { CasePriority } from '../enums/case-priority.enum';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';
export declare class CaseResponseDto {
    id: string;
    caseNumber: string;
    title: string;
    description: string;
    status: CaseStatus;
    priority: CasePriority;
    createdBy: string | UserProfileDto;
    assignedUsers: (string | UserProfileDto)[];
    tags: string[];
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}
export declare class DeleteCaseResponseDto {
    deleted: boolean;
    message: string;
}
