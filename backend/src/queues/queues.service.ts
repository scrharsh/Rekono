import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SaleEntry, SaleEntryDocument } from '../schemas/sale-entry.schema';
import { PaymentRecord, PaymentRecordDocument } from '../schemas/payment-record.schema';

const UNMATCHED_QUEUE_THRESHOLD_MINUTES = 60;

@Injectable()
export class QueuesService {
  constructor(
    @InjectModel(SaleEntry.name) private saleEntryModel: Model<SaleEntryDocument>,
    @InjectModel(PaymentRecord.name) private paymentRecordModel: Model<PaymentRecordDocument>,
  ) {}

  async getUnmatchedQueue(showroomId: string): Promise<any[]> {
    const thresholdTime = new Date(Date.now() - UNMATCHED_QUEUE_THRESHOLD_MINUTES * 60 * 1000);

    // Only include sales that have been unmatched for > 60 minutes (Requirement 4.5)
    const unmatchedSales = await this.saleEntryModel
      .find({
        showroomId,
        status: 'unmatched',
        createdAt: { $lte: thresholdTime },
      })
      .sort({ createdAt: 1 }); // Oldest first (Requirement 7.3)

    return unmatchedSales.map((sale) => {
      const ageMinutes = Math.floor(
        (Date.now() - new Date(sale.createdAt).getTime()) / (1000 * 60),
      );
      return {
        ...sale.toObject(),
        age: ageMinutes,
      };
    });
  }

  async getUnknownQueue(showroomId: string): Promise<any[]> {
    // Payments with no matches (status remains 'unmatched') (Requirement 4.4)
    const unknownPayments = await this.paymentRecordModel
      .find({
        showroomId,
        status: 'unmatched',
      })
      .sort({ createdAt: 1 }); // Oldest first (Requirement 7.4)

    return unknownPayments.map((payment) => {
      const ageMinutes = Math.floor(
        (Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60),
      );
      return {
        ...payment.toObject(),
        age: ageMinutes,
      };
    });
  }
}
