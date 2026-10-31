import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Case } from '../../cases/schemas/case.schema';
import { Evidence } from '../../evidence/schemas/evidence.schema';
import { Entity } from '../../entities/schemas/entity.schema';
import { User } from '../../auth/schemas/user.schema';
import { ReviewStatus } from '../enums/review-status.enum';

export type FindingDocument = Finding & Document;

@Schema({
  timestamps: true,
  collection: 'findings',
})
export class Finding {
  @Prop({
    type: Types.ObjectId,
    ref: Case.name,
    required: true,
    index: true,
  })
  caseId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
  })
  description: string;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  findingType: string;

  @Prop({
    required: true,
    min: 0,
    max: 1,
  })
  confidenceScore: number;

  @Prop({
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'DEFINITIVE'],
    default: 'MEDIUM',
  })
  evidenceStrength: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: Evidence.name }],
    default: [],
  })
  supportingEvidence: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: Entity.name }],
    default: [],
  })
  supportingEntities: Types.ObjectId[];

  @Prop({
    required: true,
    trim: true,
  })
  reasoning: string;

  @Prop({
    default: '',
    trim: true,
  })
  limitations: string;

  @Prop({
    required: true,
    trim: true,
    default: 'AI_SERVICE',
  })
  generatedBy: string;

  @Prop({
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.PENDING_REVIEW,
    index: true,
  })
  reviewStatus: ReviewStatus;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    default: null,
  })
  reviewedBy: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: null,
  })
  reviewedAt: Date | null;

  @Prop({
    default: '',
    trim: true,
  })
  reviewComment: string;

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

export const FindingSchema = SchemaFactory.createForClass(Finding);

FindingSchema.index({ caseId: 1, reviewStatus: 1, createdAt: -1 });
FindingSchema.index({ caseId: 1, findingType: 1 });
