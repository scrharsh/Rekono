import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CaServiceDocument = HydratedDocument<CaService>;

export enum ServiceType {
  GST_FILING = 'gst_filing',
  GST_REGISTRATION = 'gst_registration',
  INCOME_TAX_FILING = 'income_tax_filing',
  TDS_RETURN = 'tds_return',
  COMPANY_INCORPORATION = 'company_incorporation',
  MSME_REGISTRATION = 'msme_registration',
  IMPORT_EXPORT_CODE = 'import_export_code',
  CONSULTATION = 'consultation',
  COMPLIANCE_REVIEW = 'compliance_review',
  BOOKKEEPING = 'bookkeeping',
  AUDIT = 'audit',
  OTHER = 'other',
}

export enum ServiceFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  ONE_TIME = 'one_time',
}

class ServicePeriodStatus {
  @Prop({ required: true })
  period: string; // e.g., "2026-04", "Q1-2026", "FY2025-26"

  @Prop({ default: 'pending', enum: ['pending', 'in_progress', 'completed', 'overdue'] })
  status: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  notes?: string;
}

@Schema({ timestamps: true })
export class CaService {
  @Prop({ type: Types.ObjectId, ref: 'CaClient', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caUserId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(ServiceType) })
  serviceType: string;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: Object.values(ServiceFrequency), default: ServiceFrequency.ONE_TIME })
  frequency: string;

  @Prop({ required: true, min: 0 })
  fees: number;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: [ServicePeriodStatus], default: [] })
  periodStatuses: ServicePeriodStatus[];

  @Prop({ default: 'active', enum: ['active', 'paused', 'completed', 'cancelled'] })
  status: string;

  @Prop()
  notes?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CaServiceSchema = SchemaFactory.createForClass(CaService);

CaServiceSchema.index({ caUserId: 1, status: 1 });
CaServiceSchema.index({ clientId: 1, status: 1 });
CaServiceSchema.index({ caUserId: 1, serviceType: 1 });
CaServiceSchema.index({ clientId: 1, serviceType: 1 });
