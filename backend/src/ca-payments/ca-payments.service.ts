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

    const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);
    const overdueAmount = overdue.reduce((sum, p) => sum + p.amount, 0);

    return {
      pending: { items: pending, total: pendingAmount, count: pending.length },
      overdue: { items: overdue, total: overdueAmount, count: overdue.length },
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
}
