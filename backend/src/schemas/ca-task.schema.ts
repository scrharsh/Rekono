import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CaTaskDocument = HydratedDocument<CaTask>;

export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TaskType {
  REVIEW_UNMATCHED = 'review_unmatched',
  REVIEW_HIGH_VALUE = 'review_high_value',
  GSTR1_FILING = 'gstr1_filing',
  GSTR3B_FILING = 'gstr3b_filing',
  INCOME_TAX_RETURN = 'income_tax_return',
  TDS_RETURN = 'tds_return',
  GST_MISMATCH = 'gst_mismatch',
  MISSING_INVOICE = 'missing_invoice',
  MISSING_DOCUMENT = 'missing_document',
  PAYMENT_FOLLOWUP = 'payment_followup',
  CLIENT_DATA_REQUEST = 'client_data_request',
  COMPLIANCE_CHECK = 'compliance_check',
  REGISTRATION = 'registration',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true })
export class CaTask {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CaClient' })
  clientId?: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(TaskType) })
  type: string;

  @Prop({ required: true, enum: Object.values(TaskPriority), default: TaskPriority.MEDIUM })
  priority: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' })
  status: string;

  @Prop()
  dueDate?: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ required: true, enum: ['system', 'manual'], default: 'manual' })
  createdBy: string;

  @Prop()
  assignedTo?: string;

  @Prop()
  assignedToName?: string;

  @Prop({ type: Map, of: String })
  actionData?: Map<string, string>;

  @Prop()
  notes?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CaTaskSchema = SchemaFactory.createForClass(CaTask);

CaTaskSchema.index({ caUserId: 1, status: 1, priority: 1 });
CaTaskSchema.index({ caUserId: 1, clientId: 1, status: 1 });
CaTaskSchema.index({ caUserId: 1, dueDate: 1 });
CaTaskSchema.index({ caUserId: 1, type: 1, status: 1 });
CaTaskSchema.index({ caUserId: 1, assignedTo: 1, status: 1 });
