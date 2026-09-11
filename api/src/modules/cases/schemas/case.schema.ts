import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CaseStatus } from '../enums/case-status.enum';
import { CasePriority } from '../enums/case-priority.enum';
import { User } from '../../auth/schemas/user.schema';

export type CaseDocument = Case & Document;

@Schema({
  timestamps: true,
  collection: 'cases',
})
export class Case {
  @Prop({
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true,
  })
  caseNumber: string;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
  })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(CaseStatus),
    default: CaseStatus.OPEN,
    index: true,
  })
  status: CaseStatus;

  @Prop({
    type: String,
    enum: Object.values(CasePriority),
    default: CasePriority.MEDIUM,
    index: true,
  })
  priority: CasePriority;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: User.name }],
    default: [],
    index: true,
  })
  assignedUsers: Types.ObjectId[];

  @Prop({
    type: [String],
    default: [],
    index: true,
  })
  tags: string[];

  @Prop({
    default: false,
    index: true,
  })
  isDeleted: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt: Date | null;
}

export const CaseSchema = SchemaFactory.createForClass(Case);

// Compound index for efficient searching & filtering on non-deleted cases
CaseSchema.index({ isDeleted: 1, status: 1, priority: 1, createdAt: -1 });
