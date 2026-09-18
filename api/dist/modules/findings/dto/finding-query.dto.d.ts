import { ReviewStatus } from '../enums/review-status.enum';
export declare class FindingQueryDto {
    page?: number;
    limit?: number;
    reviewStatus?: ReviewStatus;
    findingType?: string;
    minConfidence?: number;
    evidenceStrength?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
