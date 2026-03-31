/**
 * fast-check arbitraries for Rekono domain objects (backend workspace).
 * Shapes mirror the Mongoose schemas in backend/src/schemas/.
 */
import * as fc from 'fast-check';
import { Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

/** Valid GSTIN: 2-digit state code + 5 uppercase letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric */
export const gstinArbitrary = fc
  .tuple(
    fc.integer({ min: 1, max: 37 }).map((n) => String(n).padStart(2, '0')),
    fc
      .array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), {
        minLength: 5,
        maxLength: 5,
      })
      .map((a) => a.join('')),
    fc.integer({ min: 1000, max: 9999 }).map(String),
    fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')),
    fc.constantFrom(...'123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')),
    fc.constantFrom(...'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')),
  )
  .map(
    ([state, pan, seq, checkLetter, checkAlpha, lastChar]) =>
      `${state}${pan}${seq}${checkLetter}${checkAlpha}Z${lastChar}`,
  );

/** Positive monetary amount (paise-level precision, max ₹50L) */
export const positiveAmountArbitrary = fc
  .float({ min: 0.01, max: 5_000_000, noNaN: true })
  .map((n) => Math.round(n * 100) / 100);

/** Valid GST rates used in India */
export const gstRateArbitrary = fc.constantFrom(0, 5, 12, 18, 28);

/** Payment methods matching PaymentRecord schema enum */
export const paymentMethodArbitrary = fc.constantFrom(
  'PhonePe',
  'Google Pay',
  'Paytm',
  'BHIM',
  'cash',
  'bank_transfer',
  'other',
);

/** Payment sources matching PaymentRecord schema enum */
export const paymentSourceArbitrary = fc.constantFrom('sms', 'manual', 'cash');

/** Match types */
export const matchTypeArbitrary = fc.constantFrom('auto', 'manual');

/** Status values shared across SaleEntry and PaymentRecord */
export const statusArbitrary = fc.constantFrom('unmatched', 'matched', 'verified');

/** User roles */
export const userRoleArbitrary = fc.constantFrom('staff', 'accountant', 'ca', 'admin');

/** Mongoose ObjectId */
export const objectIdArbitrary = fc.constant(null).map(() => new Types.ObjectId());

/** ISO timestamp within the last year */
export const recentTimestampArbitrary = fc
  .integer({ min: Date.now() - 365 * 24 * 60 * 60 * 1000, max: Date.now() })
  .map((ms) => new Date(ms));

// ---------------------------------------------------------------------------
// Domain object arbitraries
// ---------------------------------------------------------------------------

export interface SaleItemShape {
  name: string;
  hsnCode?: string;
  quantity: number;
  price: number;
  gstRate: number;
}

export const saleItemArbitrary: fc.Arbitrary<SaleItemShape> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  hsnCode: fc.option(fc.string({ minLength: 4, maxLength: 8 }), { nil: undefined }),
  quantity: fc.integer({ min: 1, max: 1000 }),
  price: positiveAmountArbitrary,
  gstRate: gstRateArbitrary,
});

export interface SaleEntryShape {
  showroomId: Types.ObjectId;
  totalAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  items: SaleItemShape[];
  customerName?: string;
  customerPhone?: string;
  customerGSTIN?: string;
  invoiceNumber?: string;
  timestamp: Date;
  status: string;
}

export const saleEntryArbitrary: fc.Arbitrary<SaleEntryShape> = fc
  .record({
    showroomId: objectIdArbitrary,
    taxableAmount: positiveAmountArbitrary,
    gstRate: gstRateArbitrary,
    items: fc.array(saleItemArbitrary, { minLength: 1, maxLength: 10 }),
    customerName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    customerPhone: fc.option(fc.string({ minLength: 10, maxLength: 10 }), { nil: undefined }),
    customerGSTIN: fc.option(gstinArbitrary, { nil: undefined }),
    invoiceNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
    timestamp: recentTimestampArbitrary,
    status: statusArbitrary,
  })
  .map(({ taxableAmount, gstRate, ...rest }) => {
    const gstAmount = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
    const halfGst = Math.round((gstAmount / 2) * 100) / 100;
    return {
      ...rest,
      taxableAmount,
      cgst: halfGst,
      sgst: halfGst,
      igst: 0,
      totalAmount: Math.round((taxableAmount + gstAmount) * 100) / 100,
    };
  });

export interface PaymentRecordShape {
  showroomId: Types.ObjectId;
  amount: number;
  source: string;
  paymentMethod: string;
  transactionId?: string;
  sender?: string;
  timestamp: Date;
  status: string;
}

export const paymentRecordArbitrary: fc.Arbitrary<PaymentRecordShape> = fc.record({
  showroomId: objectIdArbitrary,
  amount: positiveAmountArbitrary,
  source: paymentSourceArbitrary,
  paymentMethod: paymentMethodArbitrary,
  transactionId: fc.option(fc.string({ minLength: 8, maxLength: 32 }), { nil: undefined }),
  sender: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  timestamp: recentTimestampArbitrary,
  status: statusArbitrary,
});

export interface MatchShape {
  showroomId: Types.ObjectId;
  saleId: Types.ObjectId;
  paymentId: Types.ObjectId;
  confidence: number;
  matchType: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  notes?: string;
}

export const matchArbitrary: fc.Arbitrary<MatchShape> = fc.record({
  showroomId: objectIdArbitrary,
  saleId: objectIdArbitrary,
  paymentId: objectIdArbitrary,
  confidence: fc.integer({ min: 0, max: 100 }),
  matchType: matchTypeArbitrary,
  verifiedBy: fc.option(objectIdArbitrary, { nil: undefined }),
  verifiedAt: fc.option(recentTimestampArbitrary, { nil: undefined }),
  notes: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
});

export interface UserShape {
  username: string;
  password: string;
  role: string;
  showroomIds: Types.ObjectId[];
  failedLoginAttempts: number;
  lockedUntil?: Date;
}

export const userArbitrary: fc.Arbitrary<UserShape> = fc.record({
  username: fc.string({ minLength: 3, maxLength: 30 }),
  password: fc.string({ minLength: 8, maxLength: 64 }),
  role: userRoleArbitrary,
  showroomIds: fc.array(objectIdArbitrary, { minLength: 0, maxLength: 5 }),
  failedLoginAttempts: fc.integer({ min: 0, max: 10 }),
  lockedUntil: fc.option(recentTimestampArbitrary, { nil: undefined }),
});

export interface ShowroomShape {
  name: string;
  gstin: string;
  address: string;
  phone: string;
  lastInvoiceNumber: number;
}

export const showroomArbitrary: fc.Arbitrary<ShowroomShape> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  gstin: gstinArbitrary,
  address: fc.string({ minLength: 5, maxLength: 200 }),
  phone: fc.string({ minLength: 10, maxLength: 15 }),
  lastInvoiceNumber: fc.integer({ min: 0, max: 99999 }),
});
