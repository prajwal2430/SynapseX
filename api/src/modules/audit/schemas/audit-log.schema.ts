import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';

export type AuditLogDocument = AuditLog & Document;

@Schema({
  timestamps: false,
  collection: 'audit_logs',
  versionKey: false,
})
export class AuditLog {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: false,
    default: null,
    index: true,
  })
  userId: Types.ObjectId | null;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  action: string;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  resourceType: string;

  @Prop({
    required: false,
    default: null,
    trim: true,
    index: true,
  })
  resourceId?: string;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  })
  timestamp: Date;

  @Prop({
    required: false,
    default: null,
    trim: true,
  })
  ipAddress?: string;

  @Prop({
    required: false,
    default: null,
    trim: true,
  })
  userAgent?: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ timestamp: -1, action: 1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });

// Immutability Guards: Block updates and deletions to audit logs
const blockUpdate = function (next: Function) {
  next(new Error('Audit logs are append-only and strictly immutable; updates are prohibited.'));
};

AuditLogSchema.pre('updateOne', blockUpdate);
AuditLogSchema.pre('updateMany', blockUpdate);
AuditLogSchema.pre('findOneAndUpdate', blockUpdate);
AuditLogSchema.pre('replaceOne', blockUpdate);

const blockDelete = function (next: Function) {
  next(new Error('Audit logs are append-only and strictly immutable; deletions are prohibited.'));
};

AuditLogSchema.pre('deleteOne', blockDelete);
AuditLogSchema.pre('deleteMany', blockDelete);
AuditLogSchema.pre('findOneAndDelete', blockDelete);
