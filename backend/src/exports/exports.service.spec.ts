import * as XLSX from 'xlsx';
import { ExportsService } from './exports.service';

describe('ExportsService', () => {
  const saleEntryModel = {
    find: jest.fn(),
  };

  const matchModel = {
    find: jest.fn(),
  };

  let service: ExportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExportsService(saleEntryModel as any, matchModel as any);
  });

  it('generates GST summary using item price*quantity schema', async () => {
    saleEntryModel.find.mockResolvedValue([
      {
        status: 'matched',
        isInterstate: false,
        items: [
          { price: 118, quantity: 2, gstRate: 18 },
          { price: 105, quantity: 1, gstRate: 5 },
        ],
      },
      {
        status: 'matched',
        isInterstate: true,
        items: [{ price: 112, quantity: 1, gstRate: 12 }],
      },
    ]);

    const result = await service.generateGSTSummary('showroom-1', '2026-01-01', '2026-01-31');

    expect(result.transactionCount).toBe(2);
    expect(result.byRate[18]).toBeDefined();
    expect(result.byRate[5]).toBeDefined();
    expect(result.byRate[12]).toBeDefined();

    expect(result.byRate[18].total).toBe(236);
    expect(result.byRate[12].igst).toBeGreaterThan(0);
    expect(result.byRate[18].cgst).toBeGreaterThan(0);
    expect(result.byRate[18].sgst).toBeGreaterThan(0);
    expect(result.totals.total).toBeCloseTo(453, 2);
  });

  it('generates tally export and includes paymentMethod mapping', async () => {
    const populated = [
      {
        saleId: {
          timestamp: new Date('2026-01-05T10:00:00.000Z'),
          invoiceNumber: 'INV-1001',
          customerName: 'Acme Client',
          totalAmount: 118,
          taxableAmount: 100,
          cgst: 9,
          sgst: 9,
          igst: 0,
        },
        paymentId: {
          paymentMethod: 'PhonePe',
          transactionId: 'TXN123',
        },
      },
    ];

    const query: any = {
      populate: jest.fn().mockReturnThis(),
      then: (resolve: any) => resolve(populated),
    };
    matchModel.find.mockReturnValue(query);

    const buffer = await service.generateTallyExport('showroom-1', '2026-01-01', '2026-01-31');
    expect(Buffer.isBuffer(buffer)).toBe(true);

    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets['Transactions'];
    const rows = XLSX.utils.sheet_to_json(ws);

    expect(rows).toHaveLength(1);
    expect((rows[0] as any).PaymentMethod).toBe('PhonePe');
    expect((rows[0] as any).TransactionID).toBe('TXN123');
  });
});
