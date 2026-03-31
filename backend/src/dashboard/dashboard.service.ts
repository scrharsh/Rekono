import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Connection, ConnectionDocument } from '../schemas/connection.schema';
import { SharedReport, SharedReportDocument } from '../schemas/shared-report.schema';

/**
 * CA Dashboard — shows the CA's own workspace:
 * - Connected showrooms (via Connection model)
 * - Received reports (via SharedReport model)
 * - Their own tasks and deadlines
 *
 * CAs do NOT have direct access to showroom transaction data.
 * Showrooms send reports (xlsx/csv) to CAs when needed.
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Connection.name) private connectionModel: Model<ConnectionDocument>,
    @InjectModel(SharedReport.name) private reportModel: Model<SharedReportDocument>,
  ) {}

  /** Get all showrooms connected to this CA */
  async getConnectedShowrooms(caUserId: string): Promise<any[]> {
    const connections = await this.connectionModel
      .find({ caUserId, status: 'active' })
      .populate('showroomId', 'name gstin address phone')
      .sort({ connectedAt: -1 });

    return connections.map((c: any) => ({
      connectionId: c._id,
      showroom: c.showroomId,
      connectedAt: c.connectedAt,
    }));
  }

  /** Get pending connection requests for this CA */
  async getPendingRequests(caUserId: string): Promise<any[]> {
    const pending = await this.connectionModel
      .find({ caUserId, status: 'pending' })
      .populate('showroomId', 'name gstin phone')
      .sort({ createdAt: -1 });

    return pending.map((c: any) => ({
      connectionId: c._id,
      showroom: c.showroomId,
      message: c.message,
      requestedAt: c.createdAt,
    }));
  }

  /** Get reports received by this CA */
  async getReceivedReports(caUserId: string): Promise<any[]> {
    return this.reportModel
      .find({ caUserId })
      .populate('showroomId', 'name gstin')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  /** Get unread report count */
  async getUnreadReportCount(caUserId: string): Promise<number> {
    return this.reportModel.countDocuments({ caUserId, status: 'unread' });
  }

  /** CA dashboard summary */
  async getDashboardSummary(caUserId: string): Promise<any> {
    const [connectedCount, pendingCount, unreadReports, recentReports] = await Promise.all([
      this.connectionModel.countDocuments({ caUserId, status: 'active' }),
      this.connectionModel.countDocuments({ caUserId, status: 'pending' }),
      this.reportModel.countDocuments({ caUserId, status: 'unread' }),
      this.reportModel
        .find({ caUserId })
        .populate('showroomId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return {
      connectedClients: connectedCount,
      pendingRequests: pendingCount,
      unreadReports,
      recentReports,
    };
  }
}
