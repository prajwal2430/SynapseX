import { Document, Types } from 'mongoose';
import { CustodyAction } from '../enums/custody-action.enum';
export type CustodyLogDocument = CustodyLog & Document;
export declare class CustodyLog {
    evidenceId: Types.ObjectId;
    caseId: Types.ObjectId;
    action: CustodyAction;
    performedBy: Types.ObjectId;
    sha256AtAction: string;
    details: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}
export declare const CustodyLogSchema: import("mongoose").Schema<CustodyLog, import("mongoose").Model<CustodyLog, any, any, any, Document<unknown, any, CustodyLog, any, {}> & CustodyLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CustodyLog, Document<unknown, {}, import("mongoose").FlatRecord<CustodyLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<CustodyLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
