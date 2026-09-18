import { Document, Types, Schema as MongooseSchema } from 'mongoose';
export type AnalysisResultDocument = AnalysisResult & Document;
export declare class ExtractedEntityRecord {
    entityType: string;
    entityValue: string;
    normalizedValue: string;
    confidence: number;
    evidenceId?: string;
    eventId?: string;
    context?: string;
}
export declare const ExtractedEntityRecordSchema: MongooseSchema<ExtractedEntityRecord, import("mongoose").Model<ExtractedEntityRecord, any, any, any, Document<unknown, any, ExtractedEntityRecord, any, {}> & ExtractedEntityRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ExtractedEntityRecord, Document<unknown, {}, import("mongoose").FlatRecord<ExtractedEntityRecord>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ExtractedEntityRecord> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class AnalysisResult {
    caseId: Types.ObjectId;
    evidenceId: Types.ObjectId;
    jobId: string;
    status: 'COMPLETED' | 'FAILED';
    entities: ExtractedEntityRecord[];
    entityCounts: Record<string, number>;
    totalEntities: number;
    executionTimeMs: number;
    error?: string;
    metadata: Record<string, any>;
}
export declare const AnalysisResultSchema: MongooseSchema<AnalysisResult, import("mongoose").Model<AnalysisResult, any, any, any, Document<unknown, any, AnalysisResult, any, {}> & AnalysisResult & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AnalysisResult, Document<unknown, {}, import("mongoose").FlatRecord<AnalysisResult>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AnalysisResult> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
