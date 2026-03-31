import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ShowroomDocument = HydratedDocument<Showroom>;

@Schema({ timestamps: true })
export class Showroom {
  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  })
  gstin: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: 0 })
  lastInvoiceNumber: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ShowroomSchema = SchemaFactory.createForClass(Showroom);

// Indexes
ShowroomSchema.index({ gstin: 1 }, { unique: true });
