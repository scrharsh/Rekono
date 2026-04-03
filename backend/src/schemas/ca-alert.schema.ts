import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CaAlertDocument = HydratedDocument<CaAlert>;

@Schema({ timestamps: true, collection: 'ca_alerts' })
export class CaAlert {
  @Prop({ required: true })
  alertId: string;

  @Prop({ required: true })
  showroomId: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, enum: ['critical', 'high', 'medium'] })
  severity: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  acknowledgedAt?: Date;

  @Prop()
  acknowledgedNotes?: string;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  lastEvaluatedAt?: Date;

  @Prop()
  showroomName?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CaAlertSchema = SchemaFactory.createForClass(CaAlert);

CaAlertSchema.index({ showroomId: 1, alertId: 1 }, { unique: true });
CaAlertSchema.index({ showroomId: 1, active: 1, severity: 1 });
CaAlertSchema.index({ showroomId: 1, acknowledgedAt: 1 });