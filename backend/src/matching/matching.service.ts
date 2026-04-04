import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from '../schemas/match.schema';
import { SaleEntry, SaleEntryDocument } from '../schemas/sale-entry.schema';
import { PaymentRecord, PaymentRecordDocument } from '../schemas/payment-record.schema';

export interface MatchCandidate {
  saleEntry: SaleEntryDocument;
  confidence: number;
  reason: string;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly timeWindowMinutes = 30;
  private readonly amountTolerance = 1;
  private readonly autoMatchThreshold = 90;

  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(SaleEntry.name) private saleEntryModel: Model<SaleEntryDocument>,
    @InjectModel(PaymentRecord.name) private paymentRecordModel: Model<PaymentRecordDocument>,
  ) {}

  async findMatches(payment: PaymentRecordDocument): Promise<MatchCandidate[]> {
    const timeWindow = this.timeWindowMinutes * 60 * 1000;
    const startTime = new Date(payment.timestamp.getTime() - timeWindow);
    const endTime = new Date(payment.timestamp.getTime() + timeWindow);

    const sales = await this.saleEntryModel.find({
      showroomId: payment.showroomId,
      timestamp: { $gte: startTime, $lte: endTime },
      totalAmount: {
        $gte: payment.amount - this.amountTolerance,
        $lte: payment.amount + this.amountTolerance,
      },
      status: { $in: ['unmatched', 'partial'] },
    });

    const candidates: MatchCandidate[] = sales.map((sale) => {
      const confidence = this.calculateConfidence(payment, sale);
      const reason = this.getConfidenceReason(payment, sale);
      return { saleEntry: sale, confidence, reason };
    });

    return candidates.sort((a, b) => b.confidence - a.confidence);
  }

  calculateConfidence(payment: PaymentRecordDocument, sale: SaleEntryDocument): number {
    let confidence = 0;

    // Amount match (50 points)
    const amountDiff = Math.abs(payment.amount - sale.totalAmount);
    if (amountDiff === 0) {
      confidence += 50;
    } else if (amountDiff <= this.amountTolerance) {
      confidence += 40;
    }

    // Time proximity (50 points)
    const timeDiffMinutes =
      Math.abs(payment.timestamp.getTime() - sale.timestamp.getTime()) / (60 * 1000);

    if (timeDiffMinutes <= 5) {
      confidence += 50;
    } else if (timeDiffMinutes <= 15) {
      confidence += 35;
    } else if (timeDiffMinutes <= 30) {
      confidence += 20;
    }

    return Math.min(confidence, 100);
  }

  private getConfidenceReason(payment: PaymentRecordDocument, sale: SaleEntryDocument): string {
    const amountDiff = Math.abs(payment.amount - sale.totalAmount);
    const timeDiffMinutes =
      Math.abs(payment.timestamp.getTime() - sale.timestamp.getTime()) / (60 * 1000);

    const reasons: string[] = [];

    if (amountDiff === 0) {
      reasons.push('Exact amount match');
    } else if (amountDiff <= this.amountTolerance) {
      reasons.push(`Amount within ₹${this.amountTolerance}`);
    }

    if (timeDiffMinutes <= 5) {
      reasons.push('Within 5 minutes');
    } else if (timeDiffMinutes <= 15) {
      reasons.push('Within 15 minutes');
    } else {
      reasons.push(`${Math.round(timeDiffMinutes)} minutes apart`);
    }

    return reasons.join(', ');
  }

  async autoMatch(payment: PaymentRecordDocument): Promise<boolean> {
    const candidates = await this.findMatches(payment);

    if (candidates.length === 1 && candidates[0].confidence >= this.autoMatchThreshold) {
      await this.confirmMatch(
        payment._id.toString(),
        candidates[0].saleEntry._id.toString(),
        'system',
        candidates[0].confidence,
      );
      this.logger.log(`Auto-matched payment ${payment._id} to sale ${candidates[0].saleEntry._id}`);
      return true;
    }

    // No single high-confidence match: payment stays unmatched (unknown queue)
    if (candidates.length === 0) {
      this.logger.log(`No matches found for payment ${payment._id} - added to unknown queue`);
    } else {
      this.logger.log(
        `${candidates.length} ambiguous match(es) for payment ${payment._id} - requires manual review`,
      );
    }

    return false;
  }

  async confirmMatch(
    paymentId: string,
    saleId: string,
    userId: string,
    confidence?: number,
    notes?: string,
  ): Promise<void> {
    const payment = await this.paymentRecordModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment record ${paymentId} not found`);
    }

    const sale = await this.saleEntryModel.findById(saleId);
    if (!sale) {
      throw new NotFoundException(`Sale entry ${saleId} not found`);
    }

    if (payment.showroomId.toString() !== sale.showroomId.toString()) {
      throw new BadRequestException('Payment and sale belong to different showrooms');
    }

    // Conflict check: payment or sale already matched/verified
    if (payment.status === 'matched' || payment.status === 'verified') {
      throw new ConflictException(`Payment ${paymentId} is already matched`);
    }
    if (sale.status === 'matched' || sale.status === 'verified') {
      throw new ConflictException(`Sale ${saleId} is already matched`);
    }

    const isManual = userId !== 'system';
    const matchConfidence = confidence ?? this.calculateConfidence(payment, sale);

    await this.matchModel.create({
      showroomId: payment.showroomId,
      saleId: sale._id,
      paymentId: payment._id,
      confidence: matchConfidence,
      matchType: isManual ? 'manual' : 'auto',
      verifiedBy: isManual ? userId : undefined,
      verifiedAt: isManual ? new Date() : undefined,
      notes: notes ?? undefined,
    });

    // For manual confirmation, mark payment as verified; for auto, mark as matched
    payment.status = isManual ? 'verified' : 'matched';
    payment.matchedSaleId = sale._id.toString();
    await payment.save();

    if (!sale.matchedPaymentIds.includes(payment._id.toString())) {
      sale.matchedPaymentIds.push(payment._id.toString());
    }

    const totalPaid = await this.calculateTotalPaid(sale);
    const diff = totalPaid - sale.totalAmount;
    const isFullyPaid = Math.abs(diff) <= this.amountTolerance;
    const isOverpaid = diff > this.amountTolerance;

    if (isOverpaid) {
      // Sum of payments exceeds sale amount beyond tolerance — flag as discrepancy
      sale.status = 'discrepancy';
    } else if (isFullyPaid) {
      // Manual confirmation of a fully-paid sale marks it as verified (removes from queues)
      sale.status = isManual ? 'verified' : 'matched';
    } else if (totalPaid > 0) {
      sale.status = 'partial';
    }

    await sale.save();
  }

  private async calculateTotalPaid(sale: SaleEntryDocument): Promise<number> {
    const payments = await this.paymentRecordModel.find({
      _id: { $in: sale.matchedPaymentIds },
    });
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }

  async getSplitPaymentStatus(saleId: string): Promise<{
    saleId: string;
    saleAmount: number;
    totalPaid: number;
    remaining: number;
    isFullyPaid: boolean;
    hasDiscrepancy: boolean;
    payments: Array<{ paymentId: string; amount: number; method: string; timestamp: Date }>;
  }> {
    const sale = await this.saleEntryModel.findById(saleId);
    if (!sale) {
      throw new NotFoundException(`Sale entry ${saleId} not found`);
    }

    const payments = await this.paymentRecordModel.find({
      _id: { $in: sale.matchedPaymentIds },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const diff = totalPaid - sale.totalAmount;
    const isFullyPaid = Math.abs(diff) <= this.amountTolerance;
    const hasDiscrepancy = diff > this.amountTolerance;

    return {
      saleId: sale._id.toString(),
      saleAmount: sale.totalAmount,
      totalPaid,
      remaining: Math.max(0, sale.totalAmount - totalPaid),
      isFullyPaid,
      hasDiscrepancy,
      payments: payments.map((p) => ({
        paymentId: p._id.toString(),
        amount: p.amount,
        method: p.paymentMethod,
        timestamp: p.timestamp,
      })),
    };
  }

  async quickMatch(
    paymentId: string,
    userId: string,
  ): Promise<{
    status: 'auto-matched' | 'suggestions';
    matchId?: string;
    suggestions?: MatchCandidate[];
  }> {
    const payment = await this.paymentRecordModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment record ${paymentId} not found`);
    }

    if (payment.status === 'matched' || payment.status === 'verified') {
      throw new ConflictException(`Payment ${paymentId} is already matched`);
    }

    const suggestions = await this.findMatches(payment);

    if (suggestions.length === 1 && suggestions[0].confidence >= this.autoMatchThreshold) {
      const match = await this.matchModel.create({
        showroomId: payment.showroomId,
        saleId: suggestions[0].saleEntry._id,
        paymentId: payment._id,
        confidence: suggestions[0].confidence,
        matchType: 'manual',
        verifiedBy: userId,
        verifiedAt: new Date(),
      });

      payment.status = 'verified';
      payment.matchedSaleId = suggestions[0].saleEntry._id.toString();
      await payment.save();

      const sale = suggestions[0].saleEntry;
      if (!sale.matchedPaymentIds.includes(payment._id.toString())) {
        sale.matchedPaymentIds.push(payment._id.toString());
      }

      const totalPaid = await this.calculateTotalPaid(sale);
      const diff = totalPaid - sale.totalAmount;
      if (Math.abs(diff) <= this.amountTolerance) {
        sale.status = 'verified';
      } else if (diff > this.amountTolerance) {
        sale.status = 'discrepancy';
      } else {
        sale.status = 'partial';
      }
      await sale.save();

      return { status: 'auto-matched', matchId: match._id.toString() };
    }

    return {
      status: 'suggestions',
      suggestions: suggestions.slice(0, 3),
    };
  }

  async getBulkSuggestions(showroomId: string): Promise<{
    unmatchedSales: Array<{
      saleId: string;
      amount: number;
      timestamp: Date;
      topSuggestion?: MatchCandidate;
    }>;
    unknownPayments: Array<{
      paymentId: string;
      amount: number;
      timestamp: Date;
      topSuggestion?: MatchCandidate;
    }>;
  }> {
    const unmatchedSales = await this.saleEntryModel.find({
      showroomId,
      status: 'unmatched',
    });

    const unknownPayments = await this.paymentRecordModel.find({
      showroomId,
      status: { $in: ['unmatched', 'unknown'] },
    });

    const salesWithSuggestions = await Promise.all(
      unmatchedSales.map(async (sale) => {
        const suggestions = await this.findMatches(sale as any);
        return {
          saleId: sale._id.toString(),
          amount: sale.totalAmount,
          timestamp: sale.timestamp,
          topSuggestion: suggestions[0],
        };
      }),
    );

    const paymentsWithSuggestions = await Promise.all(
      unknownPayments.map(async (payment) => {
        const suggestions = await this.findMatches(payment);
        return {
          paymentId: payment._id.toString(),
          amount: payment.amount,
          timestamp: payment.timestamp,
          topSuggestion: suggestions[0],
        };
      }),
    );

    return {
      unmatchedSales: salesWithSuggestions,
      unknownPayments: paymentsWithSuggestions,
    };
  }

  async findAll(
    showroomId: string,
    filters?: { matchType?: string; minConfidence?: number },
  ): Promise<MatchDocument[]> {
    const query: Record<string, any> = { showroomId };
    if (filters?.matchType) {
      query.matchType = filters.matchType;
    }
    if (filters?.minConfidence !== undefined) {
      query.confidence = { $gte: filters.minConfidence };
    }
    return this.matchModel
      .find(query)
      .populate('saleId')
      .populate('paymentId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getMatchSuggestions(paymentId: string): Promise<MatchCandidate[]> {
    const payment = await this.paymentRecordModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment record ${paymentId} not found`);
    }
    return this.findMatches(payment);
  }

  async unmatch(matchId: string): Promise<void> {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }

    const payment = await this.paymentRecordModel.findById(match.paymentId);
    const sale = await this.saleEntryModel.findById(match.saleId);

    // Delete the match record
    await this.matchModel.findByIdAndDelete(matchId);

    // Reset payment status
    if (payment) {
      payment.status = 'unmatched';
      payment.matchedSaleId = undefined;
      await payment.save();
    }

    // Remove paymentId from sale's matchedPaymentIds and recalculate status
    if (sale) {
      sale.matchedPaymentIds = sale.matchedPaymentIds.filter(
        (id) => id !== match.paymentId.toString(),
      );

      if (sale.matchedPaymentIds.length === 0) {
        sale.status = 'unmatched';
      } else {
        const totalPaid = await this.calculateTotalPaid(sale);
        const diff = totalPaid - sale.totalAmount;
        if (diff > this.amountTolerance) {
          sale.status = 'discrepancy';
        } else if (Math.abs(diff) <= this.amountTolerance) {
          sale.status = 'matched';
        } else {
          sale.status = 'partial';
        }
      }

      await sale.save();
    }
  }
}
