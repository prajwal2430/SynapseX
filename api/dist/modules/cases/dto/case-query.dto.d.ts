import { CaseStatus } from '../enums/case-status.enum';
import { CasePriority } from '../enums/case-priority.enum';
export declare class CaseQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: CaseStatus;
    priority?: CasePriority;
    tag?: string;
    assignedUser?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
