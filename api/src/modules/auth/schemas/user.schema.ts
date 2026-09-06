import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  passwordHash: string;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.INVESTIGATOR,
    index: true,
  })
  role: Role;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: null,
  })
  refreshTokenHash: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
