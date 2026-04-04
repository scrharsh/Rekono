import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

class ChangeRecord {
  @Prop({ required: true })
  field: string;

  @Prop({ type: Object })
  before?: any;

  @Prop({ type: Object })
  after?: any;
}

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({
    required: true,
    enum: [
      'match',
      'sale_entry',
      'payment_record',
      'invoice',
      'catalog_item',
      'ca_client',
      'ca_service',
      'ca_payment',
      'ca_document',
      'ca_task',
      'business_profile',
    ],
  })
  entityType: string;

  @Prop({ required: true, type: Types.ObjectId })
  entityId: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'create',
      'update',
      'delete',
      'status_change',
      'match',
      'unmatch',
      'verify',
      'assign',
      'bulk_assign',
      'reassign',
    ],
  })
  action: string;

  @Prop({ type: [ChangeRecord], default: [] })
  changes: ChangeRecord[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ default: 'user', enum: ['user', 'system'] })
  actorType: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
