import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SaleEntry, SaleEntryDocument } from '../schemas/sale-entry.schema';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(SaleEntry.name)
    private saleEntryModel: Model<SaleEntryDocument>,
  ) {}

  async create(
    showroomId: string,
    createSaleDto: CreateSaleDto,
    userId: string,
  ): Promise<SaleEntryDocument> {
    const saleData = { ...createSaleDto } as Record<string, unknown>;
    if (saleData.invoiceNumber == null || saleData.invoiceNumber === '') {
      delete saleData.invoiceNumber;
    }

    const sale = new this.saleEntryModel({
      ...saleData,
      showroomId,
      createdBy: userId,
      status: 'unmatched',
      matchedPaymentIds: [],
    });
    return sale.save();
  }

  async findAll(
    showroomId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ sales: SaleEntryDocument[]; total: number; hasMore: boolean }> {
    const { startDate, endDate, status, limit = 50, offset = 0 } = filters;
    const query: any = { showroomId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (status) query.status = status;

    const [sales, total] = await Promise.all([
      this.saleEntryModel.find(query).limit(limit).skip(offset).sort({ timestamp: -1 }).exec(),
      this.saleEntryModel.countDocuments(query).exec(),
    ]);

    return {
      sales,
      total,
      hasMore: total > offset + limit,
    };
  }

  async findOne(saleId: string): Promise<SaleEntryDocument | null> {
    return this.saleEntryModel.findById(saleId).exec();
  }

  async update(
    saleId: string,
    updateData: Partial<CreateSaleDto>,
  ): Promise<SaleEntryDocument | null> {
    const safeUpdateData = { ...updateData } as Record<string, unknown>;
    if (safeUpdateData.invoiceNumber == null || safeUpdateData.invoiceNumber === '') {
      delete safeUpdateData.invoiceNumber;
    }

    return this.saleEntryModel.findByIdAndUpdate(saleId, safeUpdateData, { new: true }).exec();
  }

  async delete(saleId: string): Promise<void> {
    await this.saleEntryModel.findByIdAndDelete(saleId).exec();
  }
}
