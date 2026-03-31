import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SharedReportDocument = HydratedDocument<SharedReport>;

/**
 * A SharedReport is created when a showroom sends an export (xlsx/csv)
 * to their connected CA. The CA can download and use it for filing.
 */
@Schema({ timestamps: true })
export class SharedReport {
  @Prop({ type: Types.ObjectId, ref: 'Showroom', required: true })
  showroomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caUserId: Types.ObjectId;

  @Prop({ required: true, enum: ['tally', 'gst_summary', 'sales', 'custom'] })
  reportType: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  period: string; // e.g. "2024-01" or "2024-01-01 to 2024-01-31"

  @Prop()
  notes?: string;

  @Prop({ default: 'unread', enum: ['unread', 'read', 'archived'] })
  status: string;

  @Prop()
  readAt?: Date;

  // In production this would be a file URL (S3/Render disk)
  // For MVP we store the base64 or a reference
  @Prop()
  fileUrl?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SharedReportSchema = SchemaFactory.createForClass(SharedReport);

SharedReportSchema.index({ caUserId: 1, status: 1 });
SharedReportSchema.index({ showroomId: 1 });
