import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MatchDocument = HydratedDocument<Match>;

@Schema({ timestamps: true })
export class Match {
  @Prop({ type: Types.ObjectId, ref: 'Showroom', required: true })
  showroomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SaleEntry', required: true })
  saleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PaymentRecord', required: true })
  paymentId: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 100 })
  confidence: number;

  @Prop({ required: true, enum: ['auto', 'manual'] })
  matchType: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy?: Types.ObjectId;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  notes?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

// Indexes
MatchSchema.index({ showroomId: 1, createdAt: -1 });
MatchSchema.index({ saleId: 1 });
MatchSchema.index({ paymentId: 1 });
MatchSchema.index({ showroomId: 1, confidence: 1 });
