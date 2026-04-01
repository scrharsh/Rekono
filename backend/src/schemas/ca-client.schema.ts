import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CaClientDocument = HydratedDocument<CaClient>;

export enum ClientBusinessType {
  PROPRIETOR = 'proprietor',
  PARTNERSHIP = 'partnership',
  PVT_LTD = 'pvt_ltd',
  LLP = 'llp',
  PUBLIC_LTD = 'public_ltd',
  HUF = 'huf',
  TRUST = 'trust',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class CaClient {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caUserId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop({
    match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  })
  gstin?: string;

  @Prop()
  pan?: string;

  @Prop({ enum: Object.values(ClientBusinessType), default: ClientBusinessType.PROPRIETOR })
  businessType: string;

  @Prop()
  businessName?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  pincode?: string;

  @Prop({ default: 100, min: 0, max: 100 })
  healthScore: number;

  @Prop({ default: 'active', enum: ['active', 'inactive', 'onboarding'] })
  status: string;

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'BusinessProfile' })
  linkedBusinessId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Connection' })
  connectionId?: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CaClientSchema = SchemaFactory.createForClass(CaClient);

CaClientSchema.index({ caUserId: 1, status: 1 });
CaClientSchema.index({ caUserId: 1, healthScore: 1 });
CaClientSchema.index({ caUserId: 1, name: 1 });
CaClientSchema.index({ phone: 1 });
CaClientSchema.index({ gstin: 1 }, { sparse: true });
