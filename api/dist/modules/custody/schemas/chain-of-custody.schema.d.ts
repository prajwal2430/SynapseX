import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { CustodyAction } from '../enums/custody-action.enum';
export type ChainOfCustodyDocument = ChainOfCustody & Document;
export declare const GENESIS_HASH = "GENESIS";
export declare class ChainOfCustody {
    evidenceId: Types.ObjectId;
    caseId: Types.ObjectId;
    action: CustodyAction;
    actorId: Types.ObjectId;
    timestamp: Date;
    sequenceNumber: number;
    metadata: Record<string, any>;
    previousRecordHash: string;
    recordHash: string;
}
export declare const ChainOfCustodySchema: MongooseSchema<ChainOfCustody, import("mongoose").Model<ChainOfCustody, any, any, any, Document<unknown, any, ChainOfCustody, any, {}> & ChainOfCustody & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChainOfCustody, Document<unknown, {}, import("mongoose").FlatRecord<ChainOfCustody>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ChainOfCustody> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
