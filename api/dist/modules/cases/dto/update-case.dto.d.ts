import { CaseStatus } from '../enums/case-status.enum';
import { CasePriority } from '../enums/case-priority.enum';
export declare class UpdateCaseDto {
    title?: string;
    description?: string;
    status?: CaseStatus;
    priority?: CasePriority;
    assignedUsers?: string[];
    tags?: string[];
}
