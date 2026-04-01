import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SaleEntry, SaleEntryDocument } from '../schemas/sale-entry.schema';
import { Match, MatchDocument } from '../schemas/match.schema';
import * as XLSX from 'xlsx';

@Injectable()
export class ExportsService {
  constructor(
    @InjectModel(SaleEntry.name) private saleEntryModel: Model<SaleEntryDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
  ) {}

  async generateTallyExport(
    showroomId: string,
    startDate: string,
    endDate: string,
  ): Promise<Buffer> {
    const matches = await this.matchModel
      .find({
        showroomId,
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        verifiedBy: { $exists: true },
      })
      .populate('saleId')
      .populate('paymentId');

    const tallyData = matches.map((match: any) => ({
      Date: new Date(match.saleId.timestamp).toLocaleDateString('en-GB'),
      VoucherType: 'Sales',
      VoucherNumber: match.saleId.invoiceNumber || '',
      PartyName: match.saleId.customerName || 'Cash Sale',
      Amount: match.saleId.totalAmount.toFixed(2),
      TaxableAmount: match.saleId.taxableAmount.toFixed(2),
      CGST: match.saleId.cgst.toFixed(2),
      SGST: match.saleId.sgst.toFixed(2),
      IGST: (match.saleId.igst || 0).toFixed(2),
      PaymentMethod: match.paymentId.paymentMethod || '',
      TransactionID: match.paymentId.transactionId || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(tallyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
    ];

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async generateGSTSummary(showroomId: string, startDate: string, endDate: string): Promise<any> {
    const sales = await this.saleEntryModel.find({
      showroomId,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: 'matched',
    });

    const summaryByRate: Record<number, any> = {};

    sales.forEach((sale) => {
      sale.items.forEach((item: any) => {
        const rate = item.gstRate;
        if (!summaryByRate[rate]) {
          summaryByRate[rate] = {
            taxable: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total: 0,
          };
        }

        const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        const itemTaxable = itemTotal / (1 + rate / 100);
        const itemGST = itemTotal - itemTaxable;

        summaryByRate[rate].taxable += itemTaxable;

        if (sale.isInterstate) {
          summaryByRate[rate].igst += itemGST;
        } else {
          summaryByRate[rate].cgst += itemGST / 2;
          summaryByRate[rate].sgst += itemGST / 2;
        }

        summaryByRate[rate].total += itemTotal;
      });
    });

    Object.keys(summaryByRate).forEach((rate) => {
      summaryByRate[Number(rate)].taxable =
        Math.round(summaryByRate[Number(rate)].taxable * 100) / 100;
      summaryByRate[Number(rate)].cgst = Math.round(summaryByRate[Number(rate)].cgst * 100) / 100;
      summaryByRate[Number(rate)].sgst = Math.round(summaryByRate[Number(rate)].sgst * 100) / 100;
      summaryByRate[Number(rate)].igst = Math.round(summaryByRate[Number(rate)].igst * 100) / 100;
      summaryByRate[Number(rate)].total = Math.round(summaryByRate[Number(rate)].total * 100) / 100;
    });

    const totals = Object.values(summaryByRate).reduce(
      (acc: any, curr: any) => ({
        taxable: acc.taxable + curr.taxable,
        cgst: acc.cgst + curr.cgst,
        sgst: acc.sgst + curr.sgst,
        igst: acc.igst + curr.igst,
        total: acc.total + curr.total,
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
    );

    totals.taxable = Math.round(totals.taxable * 100) / 100;
    totals.cgst = Math.round(totals.cgst * 100) / 100;
    totals.sgst = Math.round(totals.sgst * 100) / 100;
    totals.igst = Math.round(totals.igst * 100) / 100;
    totals.total = Math.round(totals.total * 100) / 100;

    return {
      byRate: summaryByRate,
      totals,
      period: {
        startDate,
        endDate,
      },
      transactionCount: sales.length,
    };
  }
}
