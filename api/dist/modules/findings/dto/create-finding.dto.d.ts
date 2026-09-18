export declare class CreateFindingDto {
    caseId: string;
    title: string;
    description: string;
    findingType: string;
    confidenceScore: number;
    evidenceStrength?: string;
    supportingEvidence?: string[];
    supportingEntities?: string[];
    reasoning: string;
    limitations?: string;
    generatedBy?: string;
}
