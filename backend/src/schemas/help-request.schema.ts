import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HelpRequestDocument = HydratedDocument<HelpRequest>;

@Schema({ timestamps: true })
export class HelpRequest {
  @Prop({ type: Types.ObjectId, ref: 'Showroom', required: true })
  showroomId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'pending', enum: ['pending', 'assigned', 'completed'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const HelpRequestSchema = SchemaFactory.createForClass(HelpRequest);

// Indexes
HelpRequestSchema.index({ showroomId: 1, status: 1 });
HelpRequestSchema.index({ assignedTo: 1 });
