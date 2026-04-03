import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaPayment, CaPaymentDocument } from '../schemas/ca-payment.schema';

@Injectable()
export class CaPaymentsService {
  constructor(
    @InjectModel(CaPayment.name) private paymentModel: Model<CaPaymentDocument>,
  ) {}

  async create(caUserId: string, dto: any): Promise<CaPaymentDocument> {
    return this.paymentModel.create({
      ...dto,
      status: dto.status || 'pending',
      caUserId: new Types.ObjectId(caUserId),
      clientId: new Types.ObjectId(dto.clientId),
      serviceId: dto.serviceId ? new Types.ObjectId(dto.serviceId) : undefined,
    });
  }

  async findAll(caUserId: string, filters?: { clientId?: string; status?: string }): Promise<CaPaymentDocument[]> {
    const query: Record<string, any> = { caUserId: new Types.ObjectId(caUserId) };
    if (filters?.clientId) query.clientId = new Types.ObjectId(filters.clientId);
    if (filters?.status) query.status = filters.status;
    return this.paymentModel.find(query).populate('clientId', 'name phone').populate('serviceId', 'name serviceType').sort({ dueDate: 1 });
  }

  async markPaid(caUserId: string, paymentId: string, paymentMethod: string, transactionRef?: string): Promise<CaPaymentDocument> {
    const payment = await this.paymentModel.findOneAndUpdate(
      { _id: new Types.ObjectId(paymentId), caUserId: new Types.ObjectId(caUserId) },
      { $set: { status: 'paid', paidDate: new Date(), paymentMethod, transactionRef } },
      { new: true },
    );
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async getPendingSummary(caUserId: string): Promise<any> {
    const caObjId = new Types.ObjectId(caUserId);
    const now = new Date();

    // Mark overdue payments
    await this.paymentModel.updateMany(
      { caUserId: caObjId, status: 'pending', dueDate: { $lt: now } },
      { $set: { status: 'overdue' } },
    );

    const [pending, overdue, totalCollected] = await Promise.all([
      this.paymentModel.find({ caUserId: caObjId, status: 'pending' })
        .populate('clientId', 'name phone').sort({ dueDate: 1 }),
      this.paymentModel.find({ caUserId: caObjId, status: 'overdue' })
        .populate('clientId', 'name phone').sort({ dueDate: 1 }),
      this.paymentModel.aggregate([
        { $match: { caUserId: caObjId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
    const totalOverdueAmount = overdue.reduce((sum, p) => sum + p.amount, 0);

    return {
      pending: { items: pending, total: totalPending, count: pending.length },
      overdue: { items: overdue, total: totalOverdueAmount, count: overdue.length },
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

  async getAgingAnalysis(caUserId: string, clientId?: string): Promise<any> {
    const caObjId = new Types.ObjectId(caUserId);
    const now = new Date();

    const query: Record<string, any> = {
      caUserId: caObjId,
      status: { $in: ['pending', 'overdue'] },
    };
    if (clientId) {
      query.clientId = new Types.ObjectId(clientId);
    }

    const payments = await this.paymentModel
      .find(query)
      .populate('clientId', 'name phone')
      .populate('serviceId', 'name serviceType');

    // Calculate age in days for each payment
    const paymentsWithAge: any[] = [];
    payments.forEach(p => {
      if (p.dueDate) {
        const daysOverdue = Math.ceil((now.getTime() - p.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        paymentsWithAge.push({ ...p.toObject(), daysOverdue });
      }
    });

    // Categorize into aging buckets
    const buckets = {
      current: { label: '0-30 days', items: [] as any[], total: 0, count: 0 },
      thirtyToSixty: { label: '30-60 days', items: [] as any[], total: 0, count: 0 },
      sixtyToNinety: { label: '60-90 days', items: [] as any[], total: 0, count: 0 },
      ninetyPlus: { label: '90+ days', items: [] as any[], total: 0, count: 0 },
    };

    paymentsWithAge.forEach(p => {
      const days = Math.abs(p.daysOverdue);
      let bucket;

      if (days <= 30) {
        bucket = buckets.current;
      } else if (days <= 60) {
        bucket = buckets.thirtyToSixty;
      } else if (days <= 90) {
        bucket = buckets.sixtyToNinety;
      } else {
        bucket = buckets.ninetyPlus;
      }

      bucket.items.push(p);
      bucket.total += p.amount;
      bucket.count += 1;
    });

    const totalAmount = paymentsWithAge.reduce((sum, p) => sum + p.amount, 0);

    return {
      summary: {
        totalPending: totalAmount,
        totalPayments: paymentsWithAge.length,
        averageAgeDays: Math.round(
          paymentsWithAge.reduce((sum, p) => sum + Math.abs(p.daysOverdue), 0) / Math.max(paymentsWithAge.length, 1),
        ),
      },
      buckets: [
        { ...buckets.current, percentage: totalAmount > 0 ? Math.round((buckets.current.total / totalAmount) * 100) : 0 },
        { ...buckets.thirtyToSixty, percentage: totalAmount > 0 ? Math.round((buckets.thirtyToSixty.total / totalAmount) * 100) : 0 },
        { ...buckets.sixtyToNinety, percentage: totalAmount > 0 ? Math.round((buckets.sixtyToNinety.total / totalAmount) * 100) : 0 },
        { ...buckets.ninetyPlus, percentage: totalAmount > 0 ? Math.round((buckets.ninetyPlus.total / totalAmount) * 100) : 0 },
      ],
      byClient: this.groupByClient(paymentsWithAge),
    };
  }

  private groupByClient(payments: any[]): any[] {
    const clientMap = new Map<string, any>();

    payments.forEach(p => {
      const clientId = p.clientId._id.toString();
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          clientId,
          clientName: p.clientId.name,
          clientPhone: p.clientId.phone,
          total: 0,
          count: 0,
          maxDaysOverdue: 0,
        });
      }

      const entry = clientMap.get(clientId);
      entry.total += p.amount;
      entry.count += 1;
      entry.maxDaysOverdue = Math.max(entry.maxDaysOverdue, Math.abs(p.daysOverdue));
    });

    return Array.from(clientMap.values()).sort((a, b) => b.total - a.total);
  }
}
