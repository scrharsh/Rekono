import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BusinessProfileDocument = HydratedDocument<BusinessProfile>;

export enum BusinessMode {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  SERVICES = 'services',
  AGENCY = 'agency',
  WORKSHOP = 'workshop',
  MIXED = 'mixed',
}

class BusinessSettings {
  @Prop({ default: true })
  autoMatchEnabled: boolean;

  @Prop({ default: true })
  progressiveCatalogEnabled: boolean;

  @Prop({ default: 5 })
  autoMatchConfidenceThreshold: number;

  @Prop({ type: [String], default: [] })
  defaultGstRates: string[];

  @Prop({ default: 'intrastate', enum: ['intrastate', 'interstate', 'both'] })
  defaultTaxType: string;
}

@Schema({ timestamps: true })
export class BusinessProfile {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({
    match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  })
  gstin?: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  pincode?: string;

  @Prop({
    required: true,
    enum: Object.values(BusinessMode),
    default: BusinessMode.RETAIL,
  })
  businessMode: string;

  @Prop({ type: [String], default: [] })
  businessCategories: string[];

  @Prop({ type: BusinessSettings, default: () => ({}) })
  settings: BusinessSettings;

  @Prop({ type: Types.ObjectId, ref: 'Showroom' })
  legacyShowroomId?: Types.ObjectId;

  @Prop({ default: 0 })
  lastInvoiceNumber: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const BusinessProfileSchema = SchemaFactory.createForClass(BusinessProfile);

BusinessProfileSchema.index({ ownerId: 1 });
BusinessProfileSchema.index({ gstin: 1 }, { unique: true, sparse: true });
BusinessProfileSchema.index({ phone: 1 });
BusinessProfileSchema.index({ businessMode: 1 });
