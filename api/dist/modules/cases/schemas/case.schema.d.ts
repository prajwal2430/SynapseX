import { Document, Types } from 'mongoose';
import { CaseStatus } from '../enums/case-status.enum';
import { CasePriority } from '../enums/case-priority.enum';
export type CaseDocument = Case & Document;
export declare class Case {
    caseNumber: string;
    title: string;
    description: string;
    status: CaseStatus;
    priority: CasePriority;
    createdBy: Types.ObjectId;
    assignedUsers: Types.ObjectId[];
    tags: string[];
    isDeleted: boolean;
    deletedAt: Date | null;
}
export declare const CaseSchema: import("mongoose").Schema<Case, import("mongoose").Model<Case, any, any, any, Document<unknown, any, Case, any, {}> & Case & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Case, Document<unknown, {}, import("mongoose").FlatRecord<Case>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Case> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
