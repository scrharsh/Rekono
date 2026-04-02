import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentRecord, PaymentRecordDocument } from '../schemas/payment-record.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';

const PAYMENT_METHOD_LABELS: Record<CreatePaymentDto['method'], string> = {
  phonepe: 'PhonePe',
  googlepay: 'Google Pay',
  paytm: 'Paytm',
  bhim: 'BHIM',
  bank: 'bank_transfer',
  cash: 'cash',
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(PaymentRecord.name)
    private paymentRecordModel: Model<PaymentRecordDocument>,
  ) {}

  async create(
    showroomId: string,
    createPaymentDto: CreatePaymentDto,
    userId: string,
  ): Promise<PaymentRecordDocument> {
    const paymentMethod = PAYMENT_METHOD_LABELS[createPaymentDto.method];
    const source = createPaymentDto.rawSMS ? 'sms' : paymentMethod === 'cash' ? 'cash' : 'manual';

    const payment = new this.paymentRecordModel({
      amount: createPaymentDto.amount,
      timestamp: createPaymentDto.timestamp,
      source,
      paymentMethod,
      transactionId: createPaymentDto.transactionId,
      sender: createPaymentDto.senderName,
      rawSMS: createPaymentDto.rawSMS,
      showroomId,
      createdBy: userId,
      status: 'unmatched',
    });
    return payment.save();
  }

  async findAll(
    showroomId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      status?: string;
      method?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ payments: PaymentRecordDocument[]; total: number; hasMore: boolean }> {
    const { startDate, endDate, status, method, limit = 50, offset = 0 } = filters;
    const query: any = { showroomId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (status) query.status = status;
    if (method) query.paymentMethod = method;

    const [payments, total] = await Promise.all([
      this.paymentRecordModel.find(query).limit(limit).skip(offset).sort({ timestamp: -1 }).exec(),
      this.paymentRecordModel.countDocuments(query).exec(),
    ]);

    return {
      payments,
      total,
      hasMore: total > offset + limit,
    };
  }

  async findOne(paymentId: string): Promise<PaymentRecordDocument | null> {
    return this.paymentRecordModel.findById(paymentId).exec();
  }
}
