import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConnectionDocument = HydratedDocument<Connection>;
export type ConnectionStatus = 'pending' | 'active' | 'rejected' | 'disconnected';

/**
 * A Connection links a Showroom to a CA on the platform.
 * - Initiated by the showroom (by CA's username or ID)
 * - CA accepts or rejects
 * - Once active, showroom can send reports to the CA
 */
@Schema({ timestamps: true })
export class Connection {
  @Prop({ type: Types.ObjectId, ref: 'Showroom', required: true })
  showroomId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caUserId: Types.ObjectId;

  @Prop({ default: 'pending', enum: ['pending', 'active', 'rejected', 'disconnected'] })
  status: ConnectionStatus;

  @Prop()
  message?: string; // optional message from showroom when requesting

  @Prop()
  rejectionReason?: string;

  @Prop()
  connectedAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ConnectionSchema = SchemaFactory.createForClass(Connection);

ConnectionSchema.index({ showroomId: 1, caUserId: 1 }, { unique: true });
ConnectionSchema.index({ caUserId: 1, status: 1 });
ConnectionSchema.index({ showroomId: 1, status: 1 });
