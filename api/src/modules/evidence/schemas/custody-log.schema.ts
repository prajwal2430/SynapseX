import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustodyAction } from '../enums/custody-action.enum';
import { Evidence } from './evidence.schema';
import { Case } from '../../cases/schemas/case.schema';
import { User } from '../../auth/schemas/user.schema';

export type CustodyLogDocument = CustodyLog & Document;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'custody_logs',
})
export class CustodyLog {
  @Prop({
    type: Types.ObjectId,
    ref: Evidence.name,
    required: true,
    index: true,
  })
  evidenceId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Case.name,
    required: true,
    index: true,
  })
  caseId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(CustodyAction),
    required: true,
    index: true,
  })
  action: CustodyAction;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  performedBy: Types.ObjectId;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
  })
  sha256AtAction: string;

  @Prop({
    required: true,
    trim: true,
  })
  details: string;

  @Prop({
    trim: true,
  })
  ipAddress?: string;

  @Prop({
    trim: true,
  })
  userAgent?: string;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  timestamp: Date;
}

export const CustodyLogSchema = SchemaFactory.createForClass(CustodyLog);

CustodyLogSchema.index({ evidenceId: 1, timestamp: -1 });
CustodyLogSchema.index({ caseId: 1, timestamp: -1 });
