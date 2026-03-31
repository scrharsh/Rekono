import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SaleEntry, SaleEntryDocument } from '../schemas/sale-entry.schema';
import { PaymentRecord, PaymentRecordDocument } from '../schemas/payment-record.schema';
import { Match, MatchDocument } from '../schemas/match.schema';

@Injectable()
export class CaosService {
  constructor(
    @InjectModel(SaleEntry.name) private saleEntryModel: Model<SaleEntryDocument>,
    @InjectModel(PaymentRecord.name) private paymentRecordModel: Model<PaymentRecordDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
  ) {}

  async calculateHealthScore(showroomId: string): Promise<{ score: number; breakdown: any }> {
    const [totalSales, totalPayments, matches, unmatchedSales, unmatchedPayments] =
      await Promise.all([
        this.saleEntryModel.countDocuments({ showroomId }),
        this.paymentRecordModel.countDocuments({ showroomId }),
        this.matchModel.countDocuments({ showroomId }),
        this.saleEntryModel.countDocuments({ showroomId, status: 'unmatched' }),
        this.paymentRecordModel.countDocuments({ showroomId, status: 'unmatched' }),
      ]);

    let score = 100;
    const breakdown: any = {
      base: 100,
      deductions: [],
    };

    if (totalSales > 0) {
      const missingRate = (unmatchedSales / totalSales) * 100;
      if (missingRate > 5) {
        const deduction = Math.min(20, Math.floor(missingRate / 5) * 5);
        score -= deduction;
        breakdown.deductions.push({
          reason: 'Missing entries exceed 5%',
          amount: deduction,
          value: `${missingRate.toFixed(1)}%`,
        });
      }
    }

    if (totalPayments > 0) {
      const unmatchedRate = (unmatchedPayments / totalPayments) * 100;
      if (unmatchedRate > 10) {
        const deduction = Math.min(20, Math.floor(unmatchedRate / 10) * 5);
        score -= deduction;
        breakdown.deductions.push({
          reason: 'Unmatched payments exceed 10%',
          amount: deduction,
          value: `${unmatchedRate.toFixed(1)}%`,
        });
      }
    }

    if (totalSales > 0) {
      const autoMatchRate = (matches / totalSales) * 100;
      if (autoMatchRate < 70) {
        const deduction = 15;
        score -= deduction;
        breakdown.deductions.push({
          reason: 'Auto-match rate below 70%',
          amount: deduction,
          value: `${autoMatchRate.toFixed(1)}%`,
        });
      }
      if (autoMatchRate < 50) {
        const deduction = 15;
        score -= deduction;
        breakdown.deductions.push({
          reason: 'Auto-match rate below 50%',
          amount: deduction,
          value: `${autoMatchRate.toFixed(1)}%`,
        });
      }
    }

    return {
      score: Math.max(0, score),
      breakdown,
    };
  }

  async generateTasks(showroomId: string): Promise<any[]> {
    const tasks: any[] = [];
    const now = new Date();

    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const oldUnmatched = await this.saleEntryModel.countDocuments({
      showroomId,
      status: 'unmatched',
      timestamp: { $lt: twoDaysAgo },
    });

    if (oldUnmatched > 0) {
      tasks.push({
        id: `unmatched-${showroomId}`,
        type: 'review_unmatched',
        priority: 'high',
        title: 'Review unmatched transactions',
        description: `${oldUnmatched} transactions unmatched for over 48 hours`,
        dueDate: now,
        showroomId,
      });
    }

    const highValueUnmatched = await this.saleEntryModel.find({
      showroomId,
      status: 'unmatched',
      totalAmount: { $gt: 10000 },
    });

    if (highValueUnmatched.length > 0) {
      tasks.push({
        id: `high-value-${showroomId}`,
        type: 'review_high_value',
        priority: 'high',
        title: 'Review high-value unmatched transactions',
        description: `${highValueUnmatched.length} transactions over ₹10,000 need attention`,
        dueDate: now,
        showroomId,
      });
    }

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 11);
    const daysUntilDeadline = Math.ceil(
      (nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
      tasks.push({
        id: `gstr1-${showroomId}`,
        type: 'gstr1_filing',
        priority: daysUntilDeadline <= 3 ? 'high' : 'medium',
        title: 'GSTR-1 filing due',
        description: `GSTR-1 filing due in ${daysUntilDeadline} days`,
        dueDate: nextMonth,
        showroomId,
      });
    }

    return tasks;
  }

  async generateAlerts(showroomId: string): Promise<any[]> {
    const alerts: any[] = [];

    const sales = await this.saleEntryModel
      .find({
        showroomId,
        status: 'matched',
      })
      .limit(100);

    let totalGSTMismatch = 0;
    sales.forEach((sale) => {
      const calculatedGST = sale.cgst + sale.sgst + (sale.igst || 0);
      const expectedGST = sale.totalAmount - sale.taxableAmount;
      const diff = Math.abs(calculatedGST - expectedGST);
      if (diff > 1) {
        totalGSTMismatch += diff;
      }
    });

    if (totalGSTMismatch > 5000) {
      alerts.push({
        id: `gst-mismatch-${showroomId}`,
        type: 'gst_mismatch',
        severity: 'critical',
        title: 'GST mismatch detected',
        description: `Total GST mismatch of ₹${totalGSTMismatch.toFixed(2)} found`,
        showroomId,
      });
    }

    const salesWithoutInvoice = await this.saleEntryModel.countDocuments({
      showroomId,
      status: 'matched',
      invoiceNumber: { $exists: false },
    });

    if (salesWithoutInvoice > 0) {
      alerts.push({
        id: `missing-invoice-${showroomId}`,
        type: 'missing_invoice',
        severity: 'high',
        title: 'Transactions without invoices',
        description: `${salesWithoutInvoice} matched transactions lack invoice numbers`,
        showroomId,
      });
    }

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 11);
    const daysUntilDeadline = Math.ceil(
      (nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
      alerts.push({
        id: `gstr1-deadline-${showroomId}`,
        type: 'filing_deadline',
        severity: 'critical',
        title: 'GSTR-1 deadline approaching',
        description: `Filing due in ${daysUntilDeadline} days`,
        showroomId,
      });
    }

    return alerts;
  }

  async generateSmartSummary(showroomId: string, startDate: Date, endDate: Date): Promise<any> {
    const sales = await this.saleEntryModel.find({
      showroomId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalGST = sales.reduce(
      (sum, sale) => sum + (sale.cgst + sale.sgst + (sale.igst || 0)),
      0,
    );

    const [unmatchedCount, lowConfidenceCount] = await Promise.all([
      this.saleEntryModel.countDocuments({ showroomId, status: 'unmatched' }),
      this.matchModel.countDocuments({
        showroomId,
        confidence: { $lt: 90 },
        verifiedBy: { $exists: false },
      }),
    ]);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      totalSales: Math.round(totalSales * 100) / 100,
      totalGST: Math.round(totalGST * 100) / 100,
      transactionCount: sales.length,
      filingStatus: 'pending',
      unresolvedIssues: unmatchedCount + lowConfidenceCount,
    };
  }
}
