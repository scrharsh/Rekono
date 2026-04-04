import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: string;
    changes?: { field: string; before?: any; after?: any }[];
    userId?: string;
    actorType?: 'user' | 'system';
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!Types.ObjectId.isValid(params.entityId)) {
      return;
    }

    if (params.userId && !Types.ObjectId.isValid(params.userId)) {
      params.userId = undefined;
    }

    await this.auditModel.create({
      entityType: params.entityType,
      entityId: new Types.ObjectId(params.entityId),
      action: params.action,
      changes: params.changes || [],
      userId: params.userId ? new Types.ObjectId(params.userId) : undefined,
      actorType: params.actorType || 'user',
      metadata: params.metadata,
    });
  }

  async getEntityHistory(entityType: string, entityId: string): Promise<AuditLogDocument[]> {
    return this.auditModel
      .find({ entityType, entityId: new Types.ObjectId(entityId) })
      .populate('userId', 'username role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUserActivity(userId: string, limit = 50): Promise<AuditLogDocument[]> {
    return this.auditModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRecentActivity(entityType?: string, limit = 100): Promise<AuditLogDocument[]> {
    const query: Record<string, any> = {};
    if (entityType) query.entityType = entityType;
    return this.auditModel
      .find(query)
      .populate('userId', 'username role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
