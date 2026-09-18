import { Document, Types, Schema as MongooseSchema } from 'mongoose';
export type TimelineEventDocument = TimelineEvent & Document;
export declare class TimelineAssociatedEntity {
    entityType: string;
    entityValue: string;
    normalizedValue?: string;
    entityId?: string;
}
export declare const TimelineAssociatedEntitySchema: MongooseSchema<TimelineAssociatedEntity, import("mongoose").Model<TimelineAssociatedEntity, any, any, any, Document<unknown, any, TimelineAssociatedEntity, any, {}> & TimelineAssociatedEntity & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TimelineAssociatedEntity, Document<unknown, {}, import("mongoose").FlatRecord<TimelineAssociatedEntity>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<TimelineAssociatedEntity> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class TimelineEvent {
    caseId: Types.ObjectId;
    evidenceId: Types.ObjectId;
    timestamp: string;
    timezone: string;
    normalizedTimestamp: Date;
    eventType: string;
    title: string;
    description: string;
    source: string;
    entities: TimelineAssociatedEntity[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TimelineEventSchema: MongooseSchema<TimelineEvent, import("mongoose").Model<TimelineEvent, any, any, any, Document<unknown, any, TimelineEvent, any, {}> & TimelineEvent & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TimelineEvent, Document<unknown, {}, import("mongoose").FlatRecord<TimelineEvent>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<TimelineEvent> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
