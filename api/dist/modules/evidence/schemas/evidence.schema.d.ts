import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ProcessingStatus } from '../enums/processing-status.enum';
import { IntegrityStatus } from '../enums/integrity-status.enum';
import { EvidenceStatus } from '../enums/evidence-status.enum';
export type EvidenceDocument = Evidence & Document;
export declare class Evidence {
    caseId: Types.ObjectId;
    evidenceNumber: string;
    originalFilename: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    fileSizeBytes?: number;
    sha256: string;
    md5?: string;
    uploadedBy: Types.ObjectId;
    uploadedAt: Date;
    processingStatus: ProcessingStatus;
    integrityStatus: IntegrityStatus;
    metadata: Record<string, any>;
    storageBucket: string;
    status: EvidenceStatus;
    isDeleted: boolean;
    deletedAt: Date | null;
}
export declare const EvidenceSchema: MongooseSchema<Evidence, import("mongoose").Model<Evidence, any, any, any, Document<unknown, any, Evidence, any, {}> & Evidence & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Evidence, Document<unknown, {}, import("mongoose").FlatRecord<Evidence>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Evidence> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
