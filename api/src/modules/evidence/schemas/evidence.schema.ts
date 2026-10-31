import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ProcessingStatus } from '../enums/processing-status.enum';
import { IntegrityStatus } from '../enums/integrity-status.enum';
import { EvidenceStatus } from '../enums/evidence-status.enum';
import { Case } from '../../cases/schemas/case.schema';
import { User } from '../../auth/schemas/user.schema';

export type EvidenceDocument = Evidence & Document;

@Schema({
  timestamps: true,
  collection: 'evidence',
})
export class Evidence {
  @Prop({
    type: Types.ObjectId,
    ref: Case.name,
    required: true,
    index: true,
  })
  caseId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true,
  })
  evidenceNumber: string;

  @Prop({
    required: true,
    trim: true,
  })
  originalFilename: string;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  storageKey: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
  })
  mimeType: string;

  @Prop({
    required: true,
    min: 0,
  })
  fileSize: number;

  @Prop({
    min: 0,
  })
  fileSizeBytes?: number;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  sha256: string;

  @Prop({
    lowercase: true,
    trim: true,
  })
  md5?: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  uploadedBy: Types.ObjectId;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  uploadedAt: Date;

  @Prop({
    type: String,
    enum: Object.values(ProcessingStatus),
    default: ProcessingStatus.PENDING,
    index: true,
  })
  processingStatus: ProcessingStatus;

  @Prop({
    type: String,
    enum: Object.values(IntegrityStatus),
    default: IntegrityStatus.VERIFIED,
    index: true,
  })
  integrityStatus: IntegrityStatus;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata: Record<string, any>;

  @Prop({
    required: true,
    trim: true,
  })
  storageBucket: string;

  @Prop({
    type: String,
    enum: Object.values(EvidenceStatus),
    default: EvidenceStatus.UPLOADED,
    index: true,
  })
  status: EvidenceStatus;

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

export const EvidenceSchema = SchemaFactory.createForClass(Evidence);

EvidenceSchema.index({ caseId: 1, sha256: 1 });
EvidenceSchema.index({ isDeleted: 1, processingStatus: 1, createdAt: -1 });
