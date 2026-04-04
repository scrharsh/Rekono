import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaPayment, CaPaymentDocument } from '../schemas/ca-payment.schema';

const MAX_PAGE_LIMIT = 500;
const MAX_SAMPLE_LIMIT = 1000;

@Injectable()
export class CaPaymentsService {
  constructor(@InjectModel(CaPayment.name) private paymentModel: Model<CaPaymentDocument>) {}

  async create(caUserId: string, dto: any): Promise<CaPaymentDocument> {
    return this.paymentModel.create({
      ...dto,
      status: dto.status || 'pending',
      caUserId: new Types.ObjectId(caUserId),
      clientId: new Types.ObjectId(dto.clientId),
      serviceId: dto.serviceId ? new Types.ObjectId(dto.serviceId) : undefined,
    });
  }

  private normalizeLimit(value: number | undefined, fallback: number, max: number): number {
    if (!Number.isFinite(value ?? NaN)) {
      return fallback;
    }

    return Math.min(Math.max(Math.trunc(value as number), 1), max);
  }

  async findAll(
    caUserId: string,
    filters?: { clientId?: string; status?: string; limit?: number; offset?: number },
  ): Promise<CaPaymentDocument[]> {
    const query: Record<string, any> = { caUserId: new Types.ObjectId(caUserId) };
    if (filters?.clientId) query.clientId = new Types.ObjectId(filters.clientId);
    if (filters?.status) query.status = filters.status;

    const limit = this.normalizeLimit(filters?.limit, 200, MAX_PAGE_LIMIT);
    const offset = Math.max(Math.trunc(filters?.offset ?? 0), 0);

    return this.paymentModel
      .find(query)
      .populate('clientId', 'name phone')
      .populate('serviceId', 'name serviceType')
      .sort({ dueDate: 1 })
      .skip(offset)
      .limit(limit);
  }

  async markPaid(
    caUserId: string,
    paymentId: string,
    paymentMethod: string,
    transactionRef?: string,
  ): Promise<CaPaymentDocument> {
    const payment = await this.paymentModel.findOneAndUpdate(
      { _id: new Types.ObjectId(paymentId), caUserId: new Types.ObjectId(caUserId) },
      { $set: { status: 'paid', paidDate: new Date(), paymentMethod, transactionRef } },
      { new: true },
    );
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async getPendingSummary(caUserId: string, sampleLimit?: number): Promise<any> {
    const caObjId = new Types.ObjectId(caUserId);
    const now = new Date();
    const itemLimit = this.normalizeLimit(sampleLimit, 250, MAX_SAMPLE_LIMIT);

    // Mark overdue payments
    await this.paymentModel.updateMany(
      { caUserId: caObjId, status: 'pending', dueDate: { $lt: now } },
      { $set: { status: 'overdue' } },
    );

    const [pendingItems, overdueItems, pendingAgg, overdueAgg, totalCollected] = await Promise.all([
      this.paymentModel
        .find({ caUserId: caObjId, status: 'pending' })
        .populate('clientId', 'name phone')
        .sort({ dueDate: 1 })
        .limit(itemLimit),
      this.paymentModel
        .find({ caUserId: caObjId, status: 'overdue' })
        .populate('clientId', 'name phone')
        .sort({ dueDate: 1 })
        .limit(itemLimit),
      this.paymentModel.aggregate([
        { $match: { caUserId: caObjId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      this.paymentModel.aggregate([
        { $match: { caUserId: caObjId, status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      this.paymentModel.aggregate([
        { $match: { caUserId: caObjId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalPending = pendingAgg.length > 0 ? pendingAgg[0].total : 0;
    const pendingCount = pendingAgg.length > 0 ? pendingAgg[0].count : 0;
    const totalOverdueAmount = overdueAgg.length > 0 ? overdueAgg[0].total : 0;
    const overdueCount = overdueAgg.length > 0 ? overdueAgg[0].count : 0;

    return {
      pending: {
        items: pendingItems,
        total: totalPending,
        count: pendingCount,
        isTruncated: pendingCount > pendingItems.length,
      },
      overdue: {
        items: overdueItems,
        total: totalOverdueAmount,
        count: overdueCount,
        isTruncated: overdueCount > overdueItems.length,
      },
      totalPending,
      totalOverdueAmount,
      totalCollected: totalCollected.length > 0 ? totalCollected[0].total : 0,
    };
  }

  async delete(caUserId: string, paymentId: string): Promise<void> {
    const result = await this.paymentModel.deleteOne({
      _id: new Types.ObjectId(paymentId),
      caUserId: new Types.ObjectId(caUserId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Payment not found');
  }

  async getAgingAnalysis(caUserId: string, clientId?: string, sampleLimit?: number): Promise<any> {
    const caObjId = new Types.ObjectId(caUserId);
    const now = new Date();
    const itemLimit = this.normalizeLimit(sampleLimit, 250, MAX_SAMPLE_LIMIT);

    const query: Record<string, any> = {
      caUserId: caObjId,
      status: { $in: ['pending', 'overdue'] },
    };
    if (clientId) {
      query.clientId = new Types.ObjectId(clientId);
    }

    const [bucketAgg, totalsAgg, byClientAgg, samplePayments] = await Promise.all([
      this.paymentModel.aggregate([
        { $match: query },
        {
          $addFields: {
            daysOverdue: {
              $abs: {
                $dateDiff: {
                  startDate: '$dueDate',
                  endDate: now,
                  unit: 'day',
                },
              },
            },
          },
        },
        {
          $project: {
            amount: 1,
            bucket: {
              $switch: {
                branches: [
                  { case: { $lte: ['$daysOverdue', 30] }, then: 'current' },
                  { case: { $lte: ['$daysOverdue', 60] }, then: 'thirtyToSixty' },
                  { case: { $lte: ['$daysOverdue', 90] }, then: 'sixtyToNinety' },
                ],
                default: 'ninetyPlus',
              },
            },
          },
        },
        { $group: { _id: '$bucket', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      this.paymentModel.aggregate([
        { $match: query },
        {
          $addFields: {
            daysOverdue: {
              $abs: {
                $dateDiff: {
                  startDate: '$dueDate',
                  endDate: now,
                  unit: 'day',
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalPending: { $sum: '$amount' },
            totalPayments: { $sum: 1 },
            averageAgeDays: { $avg: '$daysOverdue' },
          },
        },
      ]),
      this.paymentModel.aggregate([
        { $match: query },
        {
          $addFields: {
            daysOverdue: {
              $abs: {
                $dateDiff: {
                  startDate: '$dueDate',
                  endDate: now,
                  unit: 'day',
                },
              },
            },
          },
        },
        {
          $group: {
            _id: '$clientId',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            maxDaysOverdue: { $max: '$daysOverdue' },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 100 },
        {
          $lookup: {
            from: 'caclients',
            localField: '_id',
            foreignField: '_id',
            as: 'client',
          },
        },
        {
          $project: {
            _id: 0,
            clientId: '$_id',
            clientName: { $ifNull: [{ $arrayElemAt: ['$client.name', 0] }, 'Unknown Client'] },
            clientPhone: { $arrayElemAt: ['$client.phone', 0] },
            total: 1,
            count: 1,
            maxDaysOverdue: 1,
          },
        },
      ]),
      this.paymentModel
        .find(query)
        .populate('clientId', 'name phone')
        .populate('serviceId', 'name serviceType')
        .sort({ dueDate: 1 })
        .limit(itemLimit),
    ]);

    const totals = totalsAgg[0] ?? { totalPending: 0, totalPayments: 0, averageAgeDays: 0 };
    const totalAmount = totals.totalPending || 0;

    const bucketMap = new Map<string, { total: number; count: number }>();
    bucketAgg.forEach((entry) => {
      bucketMap.set(entry._id, { total: entry.total, count: entry.count });
    });

    const paymentsWithAge = samplePayments
      .filter((payment): payment is typeof payment & { dueDate: Date } => Boolean(payment.dueDate))
      .map((payment) => ({
        ...payment.toObject(),
        daysOverdue: Math.ceil((now.getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      }));

    const buildBucket = (key: string, label: string) => {
      const meta = bucketMap.get(key) ?? { total: 0, count: 0 };
      const lower = key.toLowerCase();
      return {
        label,
        items: paymentsWithAge.filter((payment) => {
          const days = Math.abs(payment.daysOverdue);
          if (lower === 'current') return days <= 30;
          if (lower === 'thirtytosixty') return days > 30 && days <= 60;
          if (lower === 'sixtytoninety') return days > 60 && days <= 90;
          return days > 90;
        }),
        total: meta.total,
        count: meta.count,
        percentage: totalAmount > 0 ? Math.round((meta.total / totalAmount) * 100) : 0,
      };
    };

    return {
      summary: {
        totalPending: totalAmount,
        totalPayments: totals.totalPayments || 0,
        averageAgeDays: Math.round(totals.averageAgeDays || 0),
        isSampled: (totals.totalPayments || 0) > paymentsWithAge.length,
      },
      buckets: [
        buildBucket('current', '0-30 days'),
        buildBucket('thirtyToSixty', '30-60 days'),
        buildBucket('sixtyToNinety', '60-90 days'),
        buildBucket('ninetyPlus', '90+ days'),
      ],
      byClient: byClientAgg,
    };
  }
}
