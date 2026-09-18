import { CasePriority } from '../enums/case-priority.enum';
export declare class CreateCaseDto {
    title: string;
    description: string;
    priority?: CasePriority;
    tags?: string[];
    assignedUsers?: string[];
}
