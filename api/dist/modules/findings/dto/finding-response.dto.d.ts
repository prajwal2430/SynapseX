import { ReviewStatus } from '../enums/review-status.enum';
export declare class FindingResponseDto {
    id: string;
    caseId: string;
    title: string;
    description: string;
    findingType: string;
    confidenceScore: number;
    evidenceStrength: string;
    supportingEvidence: string[];
    supportingEntities: string[];
    reasoning: string;
    limitations: string;
    generatedBy: string;
    reviewStatus: ReviewStatus;
    reviewedBy: string | null;
    reviewedAt: string | null;
    reviewComment: string;
    createdAt: string;
    updatedAt: string;
}
