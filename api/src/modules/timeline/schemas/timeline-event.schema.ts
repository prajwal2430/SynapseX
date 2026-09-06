import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Case } from '../../cases/schemas/case.schema';
import { Evidence } from '../../evidence/schemas/evidence.schema';

export type TimelineEventDocument = TimelineEvent & Document;

@Schema({ _id: false })
export class TimelineAssociatedEntity {
  @Prop({ required: true, trim: true })
  entityType: string;

  @Prop({ required: true, trim: true })
  entityValue: string;

  @Prop({ trim: true })
  normalizedValue?: string;

  @Prop({ trim: true })
  entityId?: string;
}

export const TimelineAssociatedEntitySchema =
  SchemaFactory.createForClass(TimelineAssociatedEntity);

@Schema({
  timestamps: true,
  collection: 'timeline_events',
})
export class TimelineEvent {
  @Prop({
    type: Types.ObjectId,
    ref: Case.name,
    required: true,
    index: true,
  })
  caseId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Evidence.name,
    required: true,
    index: true,
  })
  evidenceId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  timestamp: string; // Preserves raw original timestamp string

  @Prop({
    required: true,
    trim: true,
    default: 'UTC',
  })
  timezone: string; // Preserves source timezone / offset (e.g. UTC, +05:30, EST)

  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  normalizedTimestamp: Date; // Standardized UTC moment for chronological sorting and range queries

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  eventType: string;

  @Prop({
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    default: '',
    trim: true,
  })
  description: string;

  @Prop({
    required: true,
    trim: true,
  })
  source: string;

  @Prop({
    type: [TimelineAssociatedEntitySchema],
    default: [],
  })
  entities: TimelineAssociatedEntity[];

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata: Record<string, any>;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  updatedAt: Date;
}

export const TimelineEventSchema = SchemaFactory.createForClass(TimelineEvent);

// Chronological timeline reconstruction index
TimelineEventSchema.index({ caseId: 1, normalizedTimestamp: 1 });
TimelineEventSchema.index({ caseId: 1, eventType: 1 });
TimelineEventSchema.index({ caseId: 1, evidenceId: 1 });
TimelineEventSchema.index({ caseId: 1, source: 1 });
