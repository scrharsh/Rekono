import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['staff', 'accountant', 'ca', 'admin'] })
  role: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Showroom' }] })
  showroomIds: Types.ObjectId[];

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop()
  lockedUntil?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ role: 1, showroomIds: 1 });
