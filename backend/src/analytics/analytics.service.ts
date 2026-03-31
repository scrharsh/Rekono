import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SaleEntry, SaleEntryDocument } from '../schemas/sale-entry.schema';
import { PaymentRecord, PaymentRecordDocument } from '../schemas/payment-record.schema';
import { Match, MatchDocument } from '../schemas/match.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(SaleEntry.name) private saleEntryModel: Model<SaleEntryDocument>,
    @InjectModel(PaymentRecord.name) private paymentRecordModel: Model<PaymentRecordDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
  ) {}

  async getAnalyticsDashboard(showroomId?: string): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query: any = {};
    if (showroomId) query.showroomId = showroomId;

    const [totalSales, totalPayments, totalMatches, autoMatches, recentSales, recentPayments] =
      await Promise.all([
        this.saleEntryModel.countDocuments(query),
        this.paymentRecordModel.countDocuments(query),
        this.matchModel.countDocuments(query),
        this.matchModel.countDocuments({ ...query, matchType: 'auto' }),
        this.saleEntryModel.countDocuments({
          ...query,
          timestamp: { $gte: thirtyDaysAgo },
        }),
        this.paymentRecordModel.countDocuments({
          ...query,
          timestamp: { $gte: thirtyDaysAgo },
        }),
      ]);

    const autoMatchRate = totalSales > 0 ? (autoMatches / totalSales) * 100 : 0;

    return {
      overview: {
        totalSales,
        totalPayments,
        totalMatches,
        autoMatchRate: Math.round(autoMatchRate * 100) / 100,
      },
      last30Days: {
        sales: recentSales,
        payments: recentPayments,
      },
      timestamp: new Date(),
    };
  }
}
