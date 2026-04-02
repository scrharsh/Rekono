import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum SubscriptionPlan {
  FREE_CA = 'free_ca',
  BUSINESS_MONTHLY = 'business_monthly',
  BUSINESS_YEARLY = 'business_yearly',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
}

class SubscriptionInfo {
  @Prop({ enum: Object.values(SubscriptionPlan), default: SubscriptionPlan.BUSINESS_MONTHLY })
  plan: SubscriptionPlan;

  @Prop({ enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.INACTIVE })
  status: SubscriptionStatus;

  @Prop({ default: true })
  required: boolean;

  @Prop()
  activatedAt?: Date;

  @Prop()
  expiresAt?: Date;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false })
  fullName: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: false })
  phone: string;

  @Prop({ required: true, enum: ['staff', 'accountant', 'ca', 'admin'] })
  role: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Showroom' }] })
  showroomIds: Types.ObjectId[];

  @Prop({ type: SubscriptionInfo, default: undefined })
  subscription?: SubscriptionInfo;

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
UserSchema.index({ role: 1, 'subscription.status': 1 });
