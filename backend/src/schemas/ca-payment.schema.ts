import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CaPaymentDocument = HydratedDocument<CaPayment>;

@Schema({ timestamps: true })
export class CaPayment {
  @Prop({ type: Types.ObjectId, ref: 'CaClient', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CaService' })
  serviceId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, enum: ['paid', 'pending', 'overdue', 'partial', 'waived'] })
  status: string;

  @Prop()
  dueDate?: Date;

  @Prop()
  paidDate?: Date;

  @Prop({ enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'other'] })
  paymentMethod?: string;

  @Prop()
  transactionRef?: string;

  @Prop()
  invoiceNumber?: string;

  @Prop()
  description?: string;

  @Prop({ default: false })
  reminderSent: boolean;

  @Prop()
  lastReminderAt?: Date;

  @Prop({ default: 0 })
  reminderCount: number;

  @Prop()
  notes?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CaPaymentSchema = SchemaFactory.createForClass(CaPayment);

CaPaymentSchema.index({ caUserId: 1, status: 1 });
CaPaymentSchema.index({ clientId: 1, status: 1 });
CaPaymentSchema.index({ caUserId: 1, dueDate: 1 });
CaPaymentSchema.index({ clientId: 1, dueDate: -1 });
CaPaymentSchema.index({ caUserId: 1, status: 1, dueDate: 1 });
