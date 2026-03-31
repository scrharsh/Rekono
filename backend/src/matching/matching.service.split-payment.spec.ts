/**
 * Unit tests for split payment handling in MatchingService.
 * Covers Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
import { NotFoundException } from '@nestjs/common';
import { MatchingService } from './matching.service';

// ---------------------------------------------------------------------------
// Minimal mock helpers
// ---------------------------------------------------------------------------

function makeSale(
  overrides: Partial<{
    _id: string;
    totalAmount: number;
    matchedPaymentIds: string[];
    status: string;
    showroomId: string;
    timestamp: Date;
  }> = {},
) {
  const sale: any = {
    _id: { toString: () => overrides._id ?? 'sale-1' },
    totalAmount: overrides.totalAmount ?? 1000,
    matchedPaymentIds: overrides.matchedPaymentIds ?? [],
    status: overrides.status ?? 'unmatched',
    showroomId: { toString: () => overrides.showroomId ?? 'showroom-1' },
    timestamp: overrides.timestamp ?? new Date('2024-01-01T10:00:00Z'),
    save: jest.fn().mockResolvedValue(undefined),
  };
  return sale;
}

function makePayment(
  overrides: Partial<{
    _id: string;
    amount: number;
    paymentMethod: string;
    timestamp: Date;
    status: string;
    showroomId: string;
    matchedSaleId: string;
  }> = {},
) {
  const payment: any = {
    _id: { toString: () => overrides._id ?? 'pay-1' },
    amount: overrides.amount ?? 1000,
    paymentMethod: overrides.paymentMethod ?? 'PhonePe',
    timestamp: overrides.timestamp ?? new Date('2024-01-01T10:00:00Z'),
    status: overrides.status ?? 'unmatched',
    showroomId: { toString: () => overrides.showroomId ?? 'showroom-1' },
    matchedSaleId: overrides.matchedSaleId,
    save: jest.fn().mockResolvedValue(undefined),
  };
  return payment;
}

function makeMatch(overrides: any = {}) {
  return { ...overrides };
}

function buildService(opts: { sale?: any; payments?: any[]; matchCreate?: jest.Mock }) {
  const { sale, payments = [], matchCreate = jest.fn().mockResolvedValue(makeMatch()) } = opts;

  const saleEntryModel: any = {
    findById: jest.fn().mockResolvedValue(sale ?? null),
    find: jest.fn(),
  };

  const paymentRecordModel: any = {
    findById: jest.fn(),
    find: jest.fn().mockResolvedValue(payments),
  };

  const matchModel: any = {
    create: matchCreate,
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  const service = new MatchingService(matchModel, saleEntryModel, paymentRecordModel);
  return { service, saleEntryModel, paymentRecordModel, matchModel };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MatchingService – split payment handling', () => {
  describe('getSplitPaymentStatus', () => {
    it('throws NotFoundException when sale does not exist', async () => {
      const { service } = buildService({ sale: null });
      await expect(service.getSplitPaymentStatus('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('returns zero totalPaid and full remaining when no payments matched', async () => {
      const sale = makeSale({ totalAmount: 500, matchedPaymentIds: [] });
      const { service } = buildService({ sale, payments: [] });

      const result = await service.getSplitPaymentStatus('sale-1');

      expect(result.totalPaid).toBe(0);
      expect(result.remaining).toBe(500);
      expect(result.isFullyPaid).toBe(false);
      expect(result.hasDiscrepancy).toBe(false);
      expect(result.payments).toHaveLength(0);
    });

    it('marks isFullyPaid when sum equals sale amount exactly', async () => {
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: ['pay-1'] });
      const payments = [makePayment({ _id: 'pay-1', amount: 1000 })];
      const { service } = buildService({ sale, payments });

      const result = await service.getSplitPaymentStatus('sale-1');

      expect(result.isFullyPaid).toBe(true);
      expect(result.hasDiscrepancy).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('marks isFullyPaid within ±₹1 tolerance (Req 5.4)', async () => {
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: ['pay-1'] });
      const payments = [makePayment({ _id: 'pay-1', amount: 999.5 })];
      const { service } = buildService({ sale, payments });

      const result = await service.getSplitPaymentStatus('sale-1');

      expect(result.isFullyPaid).toBe(true);
      expect(result.hasDiscrepancy).toBe(false);
    });

    it('returns partial status when sum is less than sale amount (Req 5.3)', async () => {
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: ['pay-1'] });
      const payments = [makePayment({ _id: 'pay-1', amount: 600 })];
      const { service } = buildService({ sale, payments });

      const result = await service.getSplitPaymentStatus('sale-1');

      expect(result.isFullyPaid).toBe(false);
      expect(result.hasDiscrepancy).toBe(false);
      expect(result.remaining).toBe(400);
    });

    it('flags discrepancy when sum exceeds sale amount beyond ₹1 tolerance (Req 5.5)', async () => {
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: ['pay-1', 'pay-2'] });
      const payments = [
        makePayment({ _id: 'pay-1', amount: 600 }),
        makePayment({ _id: 'pay-2', amount: 500 }),
      ];
      const { service } = buildService({ sale, payments });

      const result = await service.getSplitPaymentStatus('sale-1');

      expect(result.totalPaid).toBe(1100);
      expect(result.hasDiscrepancy).toBe(true);
      expect(result.isFullyPaid).toBe(false);
    });

    it('returns payment breakdown with method and timestamp (Req 5.2)', async () => {
      const ts1 = new Date('2024-01-01T10:00:00Z');
      const ts2 = new Date('2024-01-01T10:05:00Z');
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: ['pay-1', 'pay-2'] });
      const payments = [
        makePayment({ _id: 'pay-1', amount: 600, paymentMethod: 'PhonePe', timestamp: ts1 }),
        makePayment({ _id: 'pay-2', amount: 400, paymentMethod: 'cash', timestamp: ts2 }),
      ];
      const { service } = buildService({ sale, payments });

      const result = await service.getSplitPaymentStatus('sale-1');

      expect(result.payments).toHaveLength(2);
      expect(result.payments[0]).toMatchObject({
        paymentId: 'pay-1',
        amount: 600,
        method: 'PhonePe',
      });
      expect(result.payments[1]).toMatchObject({ paymentId: 'pay-2', amount: 400, method: 'cash' });
    });

    it('sums multiple split payments correctly (Req 5.1)', async () => {
      const sale = makeSale({ totalAmount: 1500, matchedPaymentIds: ['p1', 'p2', 'p3'] });
      const payments = [
        makePayment({ _id: 'p1', amount: 500 }),
        makePayment({ _id: 'p2', amount: 500 }),
        makePayment({ _id: 'p3', amount: 500 }),
      ];
      const { service } = buildService({ sale, payments });

      const result = await service.getSplitPaymentStatus('sale-1');

      expect(result.totalPaid).toBe(1500);
      expect(result.isFullyPaid).toBe(true);
    });
  });

  describe('confirmMatch – split payment status transitions', () => {
    function buildConfirmService(opts: { sale: any; payment: any; existingPayments?: any[] }) {
      const { sale, payment, existingPayments = [] } = opts;

      const saleEntryModel: any = {
        findById: jest.fn().mockResolvedValue(sale),
      };

      const paymentRecordModel: any = {
        findById: jest.fn().mockResolvedValue(payment),
        find: jest.fn().mockResolvedValue(existingPayments),
      };

      const matchModel: any = {
        create: jest.fn().mockResolvedValue({}),
      };

      return new MatchingService(matchModel, saleEntryModel, paymentRecordModel);
    }

    it('sets sale status to "matched" when single payment covers full amount (auto)', async () => {
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: [] });
      const payment = makePayment({ amount: 1000 });
      const service = buildConfirmService({ sale, payment, existingPayments: [payment] });

      await service.confirmMatch('pay-1', 'sale-1', 'system');

      expect(sale.status).toBe('matched');
    });

    it('sets sale status to "verified" when manually confirmed and fully paid', async () => {
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: [] });
      const payment = makePayment({ amount: 1000 });
      const service = buildConfirmService({ sale, payment, existingPayments: [payment] });

      await service.confirmMatch('pay-1', 'sale-1', 'user-123');

      expect(sale.status).toBe('verified');
    });

    it('sets sale status to "partial" when payment covers only part of sale amount', async () => {
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: [] });
      const payment = makePayment({ amount: 600 });
      const service = buildConfirmService({ sale, payment, existingPayments: [payment] });

      await service.confirmMatch('pay-1', 'sale-1', 'system');

      expect(sale.status).toBe('partial');
    });

    it('sets sale status to "discrepancy" when payments exceed sale amount (Req 5.5)', async () => {
      const pay1 = makePayment({ _id: 'pay-1', amount: 600 });
      const pay2 = makePayment({ _id: 'pay-2', amount: 500 });
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: ['pay-1'] });
      const service = buildConfirmService({ sale, payment: pay2, existingPayments: [pay1, pay2] });

      await service.confirmMatch('pay-2', 'sale-1', 'system');

      expect(sale.status).toBe('discrepancy');
    });

    it('sets sale status to "matched" when split payments sum within ±₹1 tolerance (Req 5.4)', async () => {
      const pay1 = makePayment({ _id: 'pay-1', amount: 600 });
      const pay2 = makePayment({ _id: 'pay-2', amount: 399.5 });
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: ['pay-1'] });
      const service = buildConfirmService({ sale, payment: pay2, existingPayments: [pay1, pay2] });

      await service.confirmMatch('pay-2', 'sale-1', 'system');

      expect(sale.status).toBe('matched');
    });

    it('adds payment id to matchedPaymentIds only once (Req 5.1)', async () => {
      const payment = makePayment({ _id: 'pay-1', amount: 1000 });
      const sale = makeSale({ totalAmount: 1000, matchedPaymentIds: ['pay-1'] });
      const service = buildConfirmService({ sale, payment, existingPayments: [payment] });

      await service.confirmMatch('pay-1', 'sale-1', 'system');

      expect(sale.matchedPaymentIds.filter((id: string) => id === 'pay-1')).toHaveLength(1);
    });
  });
});
