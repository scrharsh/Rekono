import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SaleEntry, SaleEntryDocument } from '../schemas/sale-entry.schema';
import { Showroom, ShowroomDocument } from '../schemas/showroom.schema';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(SaleEntry.name) private saleEntryModel: Model<SaleEntryDocument>,
    @InjectModel(Showroom.name) private showroomModel: Model<ShowroomDocument>,
  ) {}

  async generateInvoiceNumber(showroomId: string): Promise<string> {
    const showroom = await this.showroomModel.findById(showroomId);
    if (!showroom) {
      throw new Error('Showroom not found');
    }

    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    const lastInvoice = await this.saleEntryModel
      .findOne({
        showroomId,
        invoiceNumber: { $regex: `^${prefix}` },
      })
      .sort({ invoiceNumber: -1 });

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  validateInvoiceData(sale: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!sale.showroomId) errors.push('Showroom ID is required');
    if (!sale.totalAmount || sale.totalAmount <= 0) errors.push('Valid total amount is required');
    if (!sale.taxableAmount || sale.taxableAmount <= 0)
      errors.push('Valid taxable amount is required');
    if (!sale.timestamp) errors.push('Timestamp is required');
    if (!sale.items || sale.items.length === 0) errors.push('At least one item is required');

    const calculatedGST = sale.cgst + sale.sgst + (sale.igst || 0);
    const expectedGST = sale.totalAmount - sale.taxableAmount;
    if (Math.abs(calculatedGST - expectedGST) > 1) {
      errors.push('GST calculation mismatch');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  formatInvoiceData(sale: any, showroom: any): any {
    return {
      invoiceNumber: sale.invoiceNumber,
      date: new Date(sale.timestamp).toLocaleDateString('en-IN'),
      showroom: {
        name: showroom.name,
        gstin: showroom.gstin,
        address: showroom.address,
        phone: showroom.phone,
      },
      customer: {
        name: sale.customerName || 'Cash Customer',
        phone: sale.customerPhone,
        gstin: sale.customerGSTIN,
      },
      items: sale.items.map((item: any) => ({
        name: item.name,
        hsnCode: item.hsnCode,
        quantity: item.quantity || 1,
        rate: item.rate || item.amount,
        amount: item.amount,
        gstRate: item.gstRate,
        gstAmount: (item.amount * item.gstRate) / (100 + item.gstRate),
      })),
      summary: {
        taxableAmount: sale.taxableAmount,
        cgst: sale.cgst,
        sgst: sale.sgst,
        igst: sale.igst || 0,
        totalAmount: sale.totalAmount,
      },
    };
  }

  async createInvoice(showroomId: string, saleId: string): Promise<any> {
    const sale = await this.saleEntryModel.findById(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }

    const validation = this.validateInvoiceData(sale);
    if (!validation.valid) {
      throw new Error(`Invalid invoice data: ${validation.errors.join(', ')}`);
    }

    if (!sale.invoiceNumber) {
      sale.invoiceNumber = await this.generateInvoiceNumber(showroomId);
      await sale.save();
    }

    const showroom = await this.showroomModel.findById(showroomId);
    return this.formatInvoiceData(sale, showroom);
  }

  async getInvoiceByNumber(showroomId: string, invoiceNumber: string): Promise<any> {
    const sale = await this.saleEntryModel.findOne({ showroomId, invoiceNumber });
    if (!sale) {
      throw new Error('Invoice not found');
    }

    const showroom = await this.showroomModel.findById(showroomId);
    return this.formatInvoiceData(sale, showroom);
  }

  async listInvoices(showroomId: string, page: number = 1, limit: number = 50): Promise<any> {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.saleEntryModel
        .find({
          showroomId,
          invoiceNumber: { $exists: true, $ne: null },
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      this.saleEntryModel.countDocuments({
        showroomId,
        invoiceNumber: { $exists: true, $ne: null },
      }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
