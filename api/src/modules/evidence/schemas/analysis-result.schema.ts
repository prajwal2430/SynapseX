import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Case } from '../../cases/schemas/case.schema';
import { Evidence } from './evidence.schema';

export type AnalysisResultDocument = AnalysisResult & Document;

@Schema({ _id: false })
export class ExtractedEntityRecord {
  @Prop({ required: true, trim: true })
  entityType: string;

  @Prop({ required: true, trim: true })
  entityValue: string;

  @Prop({ required: true, trim: true })
  normalizedValue: string;

  @Prop({ default: 1.0 })
  confidence: number;

  @Prop({ trim: true })
  evidenceId?: string;

  @Prop({ trim: true })
  eventId?: string;

  @Prop({ trim: true })
  context?: string;
}

export const ExtractedEntityRecordSchema = SchemaFactory.createForClass(ExtractedEntityRecord);

@Schema({
  timestamps: true,
  collection: 'analysis_results',
})
export class AnalysisResult {
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
    index: true,
    trim: true,
  })
  jobId: string;

  @Prop({
    required: true,
    enum: ['COMPLETED', 'FAILED'],
    default: 'COMPLETED',
    index: true,
  })
  status: 'COMPLETED' | 'FAILED';

  @Prop({
    type: [ExtractedEntityRecordSchema],
    default: [],
  })
  entities: ExtractedEntityRecord[];

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  entityCounts: Record<string, number>;

  @Prop({
    default: 0,
  })
  totalEntities: number;

  @Prop({
    default: 0,
  })
  executionTimeMs: number;

  @Prop({
    trim: true,
  })
  error?: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata: Record<string, any>;
}

export const AnalysisResultSchema = SchemaFactory.createForClass(AnalysisResult);

AnalysisResultSchema.index({ evidenceId: 1, createdAt: -1 });
AnalysisResultSchema.index({ caseId: 1, createdAt: -1 });
