import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Connection, ConnectionDocument } from '../schemas/connection.schema';
import { SharedReport, SharedReportDocument } from '../schemas/shared-report.schema';
import { SaleEntry, SaleEntryDocument } from '../schemas/sale-entry.schema';
import { PaymentRecord, PaymentRecordDocument } from '../schemas/payment-record.schema';
import { Match, MatchDocument } from '../schemas/match.schema';

const DEFAULT_LIST_LIMIT = 100;
const MAX_LIST_LIMIT = 500;

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
    @InjectModel(SaleEntry.name) private saleModel: Model<SaleEntryDocument>,
    @InjectModel(PaymentRecord.name) private paymentModel: Model<PaymentRecordDocument>,
    @InjectModel(Match.name) private matchingModel: Model<MatchDocument>,
  ) {}

  private normalizeLimit(value: number | undefined, fallback: number): number {
    if (!Number.isFinite(value ?? NaN)) {
      return fallback;
    }

    return Math.min(Math.max(Math.trunc(value as number), 1), MAX_LIST_LIMIT);
  }

  /** Get all showrooms connected to this CA */
  async getConnectedShowrooms(caUserId: string, limit?: number, offset?: number): Promise<any[]> {
    const safeLimit = this.normalizeLimit(limit, DEFAULT_LIST_LIMIT);
    const safeOffset = Math.max(Math.trunc(offset ?? 0), 0);

    const connections = await this.connectionModel
      .find({ caUserId, status: 'active' })
      .populate('showroomId', 'name gstin address phone')
      .sort({ connectedAt: -1 })
      .skip(safeOffset)
      .limit(safeLimit);

    return connections.map((c: any) => ({
      connectionId: c._id,
      showroom: c.showroomId,
      connectedAt: c.connectedAt,
    }));
  }

  /** Get pending connection requests for this CA */
  async getPendingRequests(caUserId: string, limit?: number, offset?: number): Promise<any[]> {
    const safeLimit = this.normalizeLimit(limit, DEFAULT_LIST_LIMIT);
    const safeOffset = Math.max(Math.trunc(offset ?? 0), 0);

    const pending = await this.connectionModel
      .find({ caUserId, status: 'pending' })
      .populate('showroomId', 'name gstin phone')
      .sort({ createdAt: -1 })
      .skip(safeOffset)
      .limit(safeLimit);

    return pending.map((c: any) => ({
      connectionId: c._id,
      showroom: c.showroomId,
      message: c.message,
      requestedAt: c.createdAt,
    }));
  }

  /** Get reports received by this CA */
  async getReceivedReports(caUserId: string, limit?: number, offset?: number): Promise<any[]> {
    const safeLimit = this.normalizeLimit(limit, 50);
    const safeOffset = Math.max(Math.trunc(offset ?? 0), 0);

    return this.reportModel
      .find({ caUserId })
      .populate('showroomId', 'name gstin')
      .sort({ createdAt: -1 })
      .skip(safeOffset)
      .limit(safeLimit);
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

  /** Get business dashboard stats for a showroom */
  async getShowroomStats(showroomId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSales,
      matchedSalesCount,
      unmatchedSalesCount,
      totalPayments,
      matchedPaymentsCount,
      unknownPaymentsCount,
    ] = await Promise.all([
      this.saleModel.countDocuments({ showroomId, dateCreated: { $gte: today } }),
      this.matchingModel.countDocuments({
        showroomId,
        saleId: { $ne: null },
        dateCreated: { $gte: today },
      }),
      this.saleModel.countDocuments({
        showroomId,
        dateCreated: { $gte: today },
        matchedPaymentId: { $exists: false },
      }),
      this.paymentModel.countDocuments({ showroomId, dateCreated: { $gte: today } }),
      this.matchingModel.countDocuments({
        showroomId,
        paymentId: { $ne: null },
        dateCreated: { $gte: today },
      }),
      this.paymentModel.countDocuments({
        showroomId,
        dateCreated: { $gte: today },
        linkedSaleId: { $exists: false },
      }),
    ]);

    // Calculate health score based on reconciliation percentage
    const totalTxns = totalSales + totalPayments;
    const matchedTxns = matchedSalesCount + matchedPaymentsCount;
    const reconciliationHealth = totalTxns > 0 ? Math.round((matchedTxns / totalTxns) * 100) : 100;

    return {
      totalSales,
      matchedSales: matchedSalesCount,
      unmatchedSales: unmatchedSalesCount,
      totalPayments,
      matchedPayments: matchedPaymentsCount,
      unknownPayments: unknownPaymentsCount,
      reconciliationHealth,
    };
  }

  /** Get queue summaries for a showroom */
  async getShowroomQueues(showroomId: string): Promise<any> {
    const [unmatchedSales, unknownPayments] = await Promise.all([
      this.saleModel
        .find({ showroomId, matchedPaymentId: { $exists: false } })
        .sort({ dateCreated: -1 })
        .limit(10)
        .select('id amount description dateCreated'),
      this.paymentModel
        .find({ showroomId, linkedSaleId: { $exists: false } })
        .sort({ dateCreated: -1 })
        .limit(10)
        .select('id amount paymentMethod dateCreated'),
    ]);

    return {
      unmatchedSalesCount: unmatchedSales.length,
      unmatchedSales,
      unknownPaymentsCount: unknownPayments.length,
      unknownPayments,
    };
  }
}
