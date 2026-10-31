import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { CustodyAction } from '../enums/custody-action.enum';
import { Case } from '../../cases/schemas/case.schema';
import { User } from '../../auth/schemas/user.schema';

export type ChainOfCustodyDocument = ChainOfCustody & Document;

export const GENESIS_HASH = 'GENESIS';

@Schema({
  timestamps: false,
  collection: 'chain_of_custody',
  versionKey: false,
})
export class ChainOfCustody {
  @Prop({
    type: Types.ObjectId,
    ref: 'Evidence',
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
  actorId: Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  })
  timestamp: Date;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    index: true,
  })
  sequenceNumber: number;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata: Record<string, any>;

  @Prop({
    required: true,
    index: true,
    trim: true,
  })
  previousRecordHash: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
  })
  recordHash: string;
}

export const ChainOfCustodySchema = SchemaFactory.createForClass(ChainOfCustody);

ChainOfCustodySchema.index({ evidenceId: 1, sequenceNumber: 1 }, { unique: true });
ChainOfCustodySchema.index({ evidenceId: 1, timestamp: 1 });

// Immutability Guard 1: Prevent any update operations on ChainOfCustody records
const blockUpdate = function (next: Function) {
  next(new Error('ChainOfCustody records are append-only and strictly immutable; updates are prohibited.'));
};

ChainOfCustodySchema.pre('updateOne', blockUpdate);
ChainOfCustodySchema.pre('updateMany', blockUpdate);
ChainOfCustodySchema.pre('findOneAndUpdate', blockUpdate);
ChainOfCustodySchema.pre('replaceOne', blockUpdate);

// Immutability Guard 2: Prevent any deletion operations on ChainOfCustody records
const blockDelete = function (next: Function) {
  next(new Error('ChainOfCustody records are append-only and strictly immutable; deletions are prohibited.'));
};

ChainOfCustodySchema.pre('deleteOne', blockDelete);
ChainOfCustodySchema.pre('deleteMany', blockDelete);
ChainOfCustodySchema.pre('findOneAndDelete', blockDelete);
