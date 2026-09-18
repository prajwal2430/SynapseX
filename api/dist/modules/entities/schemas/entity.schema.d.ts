import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { EntityType } from '../enums/entity-type.enum';
export type EntityDocument = Entity & Document;
export declare class Entity {
    caseId: Types.ObjectId;
    evidenceId: Types.ObjectId;
    type: EntityType;
    value: string;
    normalizedValue: string;
    confidence: number;
    source: string;
    extractionMethod: string;
    evidenceStrength: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const EntitySchema: MongooseSchema<Entity, import("mongoose").Model<Entity, any, any, any, Document<unknown, any, Entity, any, {}> & Entity & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Entity, Document<unknown, {}, import("mongoose").FlatRecord<Entity>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Entity> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
