import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SaleEntryDocument = HydratedDocument<SaleEntry>;

class SaleItem {
  @Prop({ required: true })
  name: string;

  @Prop()
  hsnCode?: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  gstRate: number;
}

@Schema({ timestamps: true })
export class SaleEntry {
  @Prop({ type: Types.ObjectId, ref: 'Showroom', required: true })
  showroomId: Types.ObjectId;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  taxableAmount: number;

  @Prop({ required: true })
  cgst: number;

  @Prop({ required: true })
  sgst: number;

  @Prop({ default: 0 })
  igst: number;

  @Prop({ type: [SaleItem] })
  items: SaleItem[];

  @Prop()
  customerName?: string;

  @Prop()
  customerPhone?: string;

  @Prop()
  customerGSTIN?: string;

  @Prop()
  customerAddress?: string;

  @Prop()
  invoiceNumber?: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({
    default: 'unmatched',
    enum: ['unmatched', 'matched', 'partial', 'verified', 'discrepancy'],
    set: (value: string) => (value === 'pending' ? 'unmatched' : value),
  })
  status: string;

  @Prop({ type: [String], default: [] })
  matchedPaymentIds: string[];

  @Prop({ default: false })
  isInterstate: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SaleEntrySchema = SchemaFactory.createForClass(SaleEntry);

// Indexes
SaleEntrySchema.index({ showroomId: 1, timestamp: -1 });
SaleEntrySchema.index({ showroomId: 1, status: 1 });
SaleEntrySchema.index(
  { invoiceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { invoiceNumber: { $type: 'string' } },
  },
);
