import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { Case } from '../../cases/schemas/case.schema';
import { Evidence } from '../../evidence/schemas/evidence.schema';
import { EntityType } from '../enums/entity-type.enum';

export type EntityDocument = Entity & Document;

@Schema({
  timestamps: true,
  collection: 'entities',
})
export class Entity {
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
    type: String,
    enum: Object.values(EntityType),
    required: true,
    index: true,
  })
  type: EntityType;

  @Prop({
    required: true,
    trim: true,
  })
  value: string;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  normalizedValue: string;

  @Prop({
    required: true,
    min: 0,
    max: 1,
    default: 1.0,
  })
  confidence: number;

  @Prop({
    required: true,
    trim: true,
  })
  source: string;

  @Prop({
    required: true,
    trim: true,
    default: 'AI_ANALYSIS',
  })
  extractionMethod: string;

  @Prop({
    enum: ['LOW', 'MEDIUM', 'HIGH', 'DEFINITIVE'],
    default: 'MEDIUM',
  })
  evidenceStrength: string;

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

export const EntitySchema = SchemaFactory.createForClass(Entity);

// Prevent duplicate entity extraction records for the same evidence artifact
EntitySchema.index(
  { caseId: 1, evidenceId: 1, type: 1, normalizedValue: 1 },
  { unique: true },
);

// High-speed filtering & cross-evidence entity lookup
EntitySchema.index({ caseId: 1, type: 1, normalizedValue: 1 });
EntitySchema.index({ caseId: 1, createdAt: -1 });
EntitySchema.index({ caseId: 1, confidence: -1 });
