import { Document, Types } from 'mongoose';
import { ReviewStatus } from '../enums/review-status.enum';
export type FindingDocument = Finding & Document;
export declare class Finding {
    caseId: Types.ObjectId;
    title: string;
    description: string;
    findingType: string;
    confidenceScore: number;
    evidenceStrength: string;
    supportingEvidence: Types.ObjectId[];
    supportingEntities: Types.ObjectId[];
    reasoning: string;
    limitations: string;
    generatedBy: string;
    reviewStatus: ReviewStatus;
    reviewedBy: Types.ObjectId | null;
    reviewedAt: Date | null;
    reviewComment: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FindingSchema: import("mongoose").Schema<Finding, import("mongoose").Model<Finding, any, any, any, Document<unknown, any, Finding, any, {}> & Finding & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Finding, Document<unknown, {}, import("mongoose").FlatRecord<Finding>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Finding> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
