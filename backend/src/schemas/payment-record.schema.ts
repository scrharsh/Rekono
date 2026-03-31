import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentRecordDocument = HydratedDocument<PaymentRecord>;

@Schema({ timestamps: true })
export class PaymentRecord {
  @Prop({ type: Types.ObjectId, ref: 'Showroom', required: true })
  showroomId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['sms', 'manual', 'cash'] })
  source: string;

  @Prop({
    required: true,
    enum: ['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'cash', 'bank_transfer', 'other'],
  })
  paymentMethod: string;

  @Prop()
  transactionId?: string;

  @Prop()
  sender?: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: 'unmatched', enum: ['unmatched', 'matched', 'verified'] })
  status: string;

  @Prop()
  matchedSaleId?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PaymentRecordSchema = SchemaFactory.createForClass(PaymentRecord);

// Indexes
PaymentRecordSchema.index({ showroomId: 1, timestamp: -1 });
PaymentRecordSchema.index({ showroomId: 1, status: 1 });
PaymentRecordSchema.index({ showroomId: 1, amount: 1, timestamp: -1 });
PaymentRecordSchema.index({ transactionId: 1 }, { sparse: true });
