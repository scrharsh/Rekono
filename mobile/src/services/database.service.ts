import SQLite from 'react-native-sqlite-storage';
import uuid from 'react-native-uuid';

SQLite.enablePromise(true);

// Increment this when schema changes require migration
const DB_VERSION = 2;

let db: SQLite.SQLiteDatabase;

// ─── Initialization & Migration ──────────────────────────────────────────────

export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabase({
      name: 'rekono.db',
      location: 'default',
    });

    await createSchemaVersionTable();
    const currentVersion = await getSchemaVersion();
    await runMigrations(currentVersion);

    console.log('Database initialized successfully (version', DB_VERSION, ')');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

const createSchemaVersionTable = async () => {
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL,
      appliedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getSchemaVersion = async (): Promise<number> => {
  const [result] = await db.executeSql(
    `SELECT version FROM schema_version ORDER BY version DESC LIMIT 1`
  );
  if (result.rows.length === 0) return 0;
  return result.rows.item(0).version as number;
};

const setSchemaVersion = async (version: number) => {
  await db.executeSql(
    `INSERT INTO schema_version (version) VALUES (?)`,
    [version]
  );
};

const runMigrations = async (fromVersion: number) => {
  if (fromVersion < 1) {
    await migrateV0toV1();
  }
  if (fromVersion < 2) {
    await migrateV1toV2();
  }
};

/** V1: initial schema */
const migrateV0toV1 = async () => {
  // SaleEntry table – matches backend SaleEntry schema
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      showroomId TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      taxableAmount REAL NOT NULL DEFAULT 0,
      cgst REAL NOT NULL DEFAULT 0,
      sgst REAL NOT NULL DEFAULT 0,
      igst REAL NOT NULL DEFAULT 0,
      items TEXT NOT NULL DEFAULT '[]',
      customerName TEXT,
      customerPhone TEXT,
      customerGSTIN TEXT,
      customerAddress TEXT,
      invoiceNumber TEXT,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unmatched',
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // PaymentRecord table – matches backend PaymentRecord schema
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      showroomId TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      transactionId TEXT,
      sender TEXT,
      rawSMS TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unmatched',
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Match table – matches backend Match schema
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      showroomId TEXT NOT NULL,
      saleId TEXT NOT NULL,
      paymentId TEXT NOT NULL,
      confidence INTEGER NOT NULL DEFAULT 0,
      matchType TEXT NOT NULL DEFAULT 'auto',
      verifiedBy TEXT,
      verifiedAt TEXT,
      notes TEXT,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Review queue for failed SMS parses (Requirement 2.7)
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS review_queue (
      id TEXT PRIMARY KEY,
      showroomId TEXT NOT NULL,
      rawSMS TEXT NOT NULL,
      sender TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      reason TEXT,
      resolved INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indexes on showroomId + timestamp (most common query pattern)
  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_sales_showroom_ts ON sales (showroomId, timestamp)`);
  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_sales_showroom_status ON sales (showroomId, status)`);
  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_sales_sync ON sales (syncStatus)`);

  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_payments_showroom_ts ON payments (showroomId, timestamp)`);
  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_payments_showroom_status ON payments (showroomId, status)`);
  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_payments_sync ON payments (syncStatus)`);

  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_matches_showroom ON matches (showroomId)`);
  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_matches_sale ON matches (saleId)`);
  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_matches_payment ON matches (paymentId)`);
  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_matches_sync ON matches (syncStatus)`);

  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_review_showroom ON review_queue (showroomId, resolved)`);

  await setSchemaVersion(1);
};

/** V2: add missing columns to existing tables (ALTER TABLE migrations) */
const migrateV1toV2 = async () => {
  // Add taxableAmount / cgst / sgst / igst to sales if they don't exist yet
  // (safe to run even if columns already exist – SQLite will error, so we catch)
  const salesAlters = [
    `ALTER TABLE sales ADD COLUMN taxableAmount REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE sales ADD COLUMN cgst REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE sales ADD COLUMN sgst REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE sales ADD COLUMN igst REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE sales ADD COLUMN customerName TEXT`,
    `ALTER TABLE sales ADD COLUMN customerPhone TEXT`,
    `ALTER TABLE sales ADD COLUMN customerGSTIN TEXT`,
    `ALTER TABLE sales ADD COLUMN customerAddress TEXT`,
    `ALTER TABLE sales ADD COLUMN invoiceNumber TEXT`,
    `ALTER TABLE sales ADD COLUMN updatedAt TEXT DEFAULT CURRENT_TIMESTAMP`,
  ];

  const paymentsAlters = [
    `ALTER TABLE payments ADD COLUMN paymentMethod TEXT NOT NULL DEFAULT 'other'`,
    `ALTER TABLE payments ADD COLUMN updatedAt TEXT DEFAULT CURRENT_TIMESTAMP`,
  ];

  const matchesAlters = [
    `ALTER TABLE matches ADD COLUMN matchType TEXT NOT NULL DEFAULT 'auto'`,
    `ALTER TABLE matches ADD COLUMN verifiedBy TEXT`,
    `ALTER TABLE matches ADD COLUMN verifiedAt TEXT`,
    `ALTER TABLE matches ADD COLUMN notes TEXT`,
    `ALTER TABLE matches ADD COLUMN updatedAt TEXT DEFAULT CURRENT_TIMESTAMP`,
  ];

  for (const sql of [...salesAlters, ...paymentsAlters, ...matchesAlters]) {
    try {
      await db.executeSql(sql);
    } catch {
      // Column already exists – ignore
    }
  }

  await setSchemaVersion(2);
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SaleItem {
  name: string;
  hsnCode?: string;
  quantity: number;
  price: number;
  gstRate: 0 | 5 | 12 | 18 | 28;
}

export interface LocalSaleEntry {
  id: string;
  showroomId: string;
  totalAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  items: SaleItem[];
  customerName?: string;
  customerPhone?: string;
  customerGSTIN?: string;
  customerAddress?: string;
  invoiceNumber?: string;
  timestamp: string; // ISO string
  status: 'unmatched' | 'matched' | 'partial' | 'verified' | 'discrepancy';
  syncStatus: 'pending' | 'synced';
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalPaymentRecord {
  id: string;
  showroomId: string;
  amount: number;
  paymentMethod: 'PhonePe' | 'Google Pay' | 'Paytm' | 'BHIM' | 'cash' | 'bank_transfer' | 'other';
  transactionId?: string;
  sender?: string;
  rawSMS?: string;
  source: 'sms' | 'manual' | 'cash';
  timestamp: string; // ISO string
  status: 'unmatched' | 'matched' | 'verified';
  syncStatus: 'pending' | 'synced';
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalMatch {
  id: string;
  showroomId: string;
  saleId: string;
  paymentId: string;
  confidence: number;
  matchType: 'auto' | 'manual';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  syncStatus: 'pending' | 'synced';
  createdAt?: string;
  updatedAt?: string;
}

// ─── SaleEntry CRUD ───────────────────────────────────────────────────────────

export const saveSale = async (sale: LocalSaleEntry): Promise<LocalSaleEntry> => {
  const now = new Date().toISOString();
  await db.executeSql(
    `INSERT INTO sales
       (id, showroomId, totalAmount, taxableAmount, cgst, sgst, igst, items,
        customerName, customerPhone, customerGSTIN, customerAddress, invoiceNumber,
        timestamp, status, syncStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sale.id,
      sale.showroomId,
      sale.totalAmount,
      sale.taxableAmount,
      sale.cgst,
      sale.sgst,
      sale.igst,
      JSON.stringify(sale.items ?? []),
      sale.customerName ?? null,
      sale.customerPhone ?? null,
      sale.customerGSTIN ?? null,
      sale.customerAddress ?? null,
      sale.invoiceNumber ?? null,
      sale.timestamp,
      sale.status ?? 'unmatched',
      sale.syncStatus ?? 'pending',
      now,
      now,
    ]
  );
  return sale;
};

export const getSaleById = async (id: string): Promise<LocalSaleEntry | null> => {
  const [result] = await db.executeSql(`SELECT * FROM sales WHERE id = ?`, [id]);
  if (result.rows.length === 0) return null;
  return deserializeSale(result.rows.item(0));
};

export const getSalesByShowroom = async (
  showroomId: string,
  opts: { status?: string; limit?: number; offset?: number } = {}
): Promise<LocalSaleEntry[]> => {
  let sql = `SELECT * FROM sales WHERE showroomId = ?`;
  const params: (string|number|null)[] = [showroomId];
  if (opts.status) {
    sql += ` AND status = ?`;
    params.push(opts.status);
  }
  sql += ` ORDER BY timestamp DESC`;
  if (opts.limit !== undefined) {
    sql += ` LIMIT ?`;
    params.push(opts.limit);
  }
  if (opts.offset !== undefined) {
    sql += ` OFFSET ?`;
    params.push(opts.offset);
  }
  const [result] = await db.executeSql(sql, params);
  return result.rows.raw().map(deserializeSale);
};

export const updateSale = async (
  id: string,
  updates: Partial<Omit<LocalSaleEntry, 'id' | 'showroomId' | 'createdAt'>>
): Promise<void> => {
  const fields: string[] = [];
  const values: (string|number|null)[] = [];

  if (updates.totalAmount !== undefined) { fields.push('totalAmount = ?'); values.push(updates.totalAmount); }
  if (updates.taxableAmount !== undefined) { fields.push('taxableAmount = ?'); values.push(updates.taxableAmount); }
  if (updates.cgst !== undefined) { fields.push('cgst = ?'); values.push(updates.cgst); }
  if (updates.sgst !== undefined) { fields.push('sgst = ?'); values.push(updates.sgst); }
  if (updates.igst !== undefined) { fields.push('igst = ?'); values.push(updates.igst); }
  if (updates.items !== undefined) { fields.push('items = ?'); values.push(JSON.stringify(updates.items)); }
  if (updates.customerName !== undefined) { fields.push('customerName = ?'); values.push(updates.customerName); }
  if (updates.customerPhone !== undefined) { fields.push('customerPhone = ?'); values.push(updates.customerPhone); }
  if (updates.invoiceNumber !== undefined) { fields.push('invoiceNumber = ?'); values.push(updates.invoiceNumber); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.syncStatus !== undefined) { fields.push('syncStatus = ?'); values.push(updates.syncStatus); }

  if (fields.length === 0) return;
  fields.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.executeSql(`UPDATE sales SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteSale = async (id: string): Promise<void> => {
  await db.executeSql(`DELETE FROM sales WHERE id = ?`, [id]);
};

const deserializeSale = (row: Record<string, unknown>): LocalSaleEntry => ({
  ...(row as unknown as LocalSaleEntry),
  items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items ?? []),
});

// ─── PaymentRecord CRUD ───────────────────────────────────────────────────────

export const savePayment = async (payment: LocalPaymentRecord): Promise<LocalPaymentRecord> => {
  const now = new Date().toISOString();
  await db.executeSql(
    `INSERT INTO payments
       (id, showroomId, amount, paymentMethod, transactionId, sender, rawSMS,
        source, timestamp, status, syncStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payment.id,
      payment.showroomId,
      payment.amount,
      payment.paymentMethod,
      payment.transactionId ?? null,
      payment.sender ?? null,
      payment.rawSMS ?? null,
      payment.source,
      payment.timestamp,
      payment.status ?? 'unmatched',
      payment.syncStatus ?? 'pending',
      now,
      now,
    ]
  );
  return payment;
};

export const getPaymentById = async (id: string): Promise<LocalPaymentRecord | null> => {
  const [result] = await db.executeSql(`SELECT * FROM payments WHERE id = ?`, [id]);
  if (result.rows.length === 0) return null;
  return result.rows.item(0) as LocalPaymentRecord;
};

export const getPaymentsByShowroom = async (
  showroomId: string,
  opts: { status?: string; limit?: number; offset?: number } = {}
): Promise<LocalPaymentRecord[]> => {
  let sql = `SELECT * FROM payments WHERE showroomId = ?`;
  const params: (string|number|null)[] = [showroomId];
  if (opts.status) {
    sql += ` AND status = ?`;
    params.push(opts.status);
  }
  sql += ` ORDER BY timestamp DESC`;
  if (opts.limit !== undefined) { sql += ` LIMIT ?`; params.push(opts.limit); }
  if (opts.offset !== undefined) { sql += ` OFFSET ?`; params.push(opts.offset); }
  const [result] = await db.executeSql(sql, params);
  return result.rows.raw() as LocalPaymentRecord[];
};

export const updatePayment = async (
  id: string,
  updates: Partial<Omit<LocalPaymentRecord, 'id' | 'showroomId' | 'createdAt'>>
): Promise<void> => {
  const fields: string[] = [];
  const values: (string|number|null)[] = [];

  if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.syncStatus !== undefined) { fields.push('syncStatus = ?'); values.push(updates.syncStatus); }
  if (updates.transactionId !== undefined) { fields.push('transactionId = ?'); values.push(updates.transactionId); }

  if (fields.length === 0) return;
  fields.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.executeSql(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deletePayment = async (id: string): Promise<void> => {
  await db.executeSql(`DELETE FROM payments WHERE id = ?`, [id]);
};

// ─── Match CRUD ───────────────────────────────────────────────────────────────

export const saveMatch = async (match: LocalMatch): Promise<LocalMatch> => {
  const now = new Date().toISOString();
  await db.executeSql(
    `INSERT INTO matches
       (id, showroomId, saleId, paymentId, confidence, matchType,
        verifiedBy, verifiedAt, notes, syncStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      match.id,
      match.showroomId,
      match.saleId,
      match.paymentId,
      match.confidence,
      match.matchType ?? 'auto',
      match.verifiedBy ?? null,
      match.verifiedAt ?? null,
      match.notes ?? null,
      match.syncStatus ?? 'pending',
      now,
      now,
    ]
  );
  return match;
};

export const getMatchById = async (id: string): Promise<LocalMatch | null> => {
  const [result] = await db.executeSql(`SELECT * FROM matches WHERE id = ?`, [id]);
  if (result.rows.length === 0) return null;
  return result.rows.item(0) as LocalMatch;
};

export const getMatchesByShowroom = async (showroomId: string): Promise<LocalMatch[]> => {
  const [result] = await db.executeSql(
    `SELECT * FROM matches WHERE showroomId = ? ORDER BY createdAt DESC`,
    [showroomId]
  );
  return result.rows.raw() as LocalMatch[];
};

export const getMatchBySaleId = async (saleId: string): Promise<LocalMatch | null> => {
  const [result] = await db.executeSql(`SELECT * FROM matches WHERE saleId = ? LIMIT 1`, [saleId]);
  if (result.rows.length === 0) return null;
  return result.rows.item(0) as LocalMatch;
};

export const getMatchByPaymentId = async (paymentId: string): Promise<LocalMatch | null> => {
  const [result] = await db.executeSql(`SELECT * FROM matches WHERE paymentId = ? LIMIT 1`, [paymentId]);
  if (result.rows.length === 0) return null;
  return result.rows.item(0) as LocalMatch;
};

export const updateMatch = async (
  id: string,
  updates: Partial<Omit<LocalMatch, 'id' | 'showroomId' | 'createdAt'>>
): Promise<void> => {
  const fields: string[] = [];
  const values: (string|number|null)[] = [];

  if (updates.confidence !== undefined) { fields.push('confidence = ?'); values.push(updates.confidence); }
  if (updates.matchType !== undefined) { fields.push('matchType = ?'); values.push(updates.matchType); }
  if (updates.verifiedBy !== undefined) { fields.push('verifiedBy = ?'); values.push(updates.verifiedBy); }
  if (updates.verifiedAt !== undefined) { fields.push('verifiedAt = ?'); values.push(updates.verifiedAt); }
  if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
  if (updates.syncStatus !== undefined) { fields.push('syncStatus = ?'); values.push(updates.syncStatus); }

  if (fields.length === 0) return;
  fields.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.executeSql(`UPDATE matches SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteMatch = async (id: string): Promise<void> => {
  await db.executeSql(`DELETE FROM matches WHERE id = ?`, [id]);
};

// ─── Sync helpers ─────────────────────────────────────────────────────────────

export const getPendingSyncItems = async () => {
  const [salesResult] = await db.executeSql(
    `SELECT * FROM sales WHERE syncStatus = 'pending'`
  );
  const [paymentsResult] = await db.executeSql(
    `SELECT * FROM payments WHERE syncStatus = 'pending'`
  );
  const [matchesResult] = await db.executeSql(
    `SELECT * FROM matches WHERE syncStatus = 'pending'`
  );

  return {
    sales: salesResult.rows.raw().map(deserializeSale),
    payments: paymentsResult.rows.raw() as LocalPaymentRecord[],
    matches: matchesResult.rows.raw() as LocalMatch[],
  };
};

export const markAsSynced = async (
  type: 'sales' | 'payments' | 'matches',
  id: string
): Promise<void> => {
  await db.executeSql(
    `UPDATE ${type} SET syncStatus = 'synced', updatedAt = ? WHERE id = ?`,
    [new Date().toISOString(), id]
  );
};

// ─── Dashboard helpers ────────────────────────────────────────────────────────

export const getTodaySummary = async (showroomId: string) => {
  const today = new Date().toISOString().split('T')[0];

  const [salesResult] = await db.executeSql(
    `SELECT COUNT(*) as count, SUM(totalAmount) as total
     FROM sales
     WHERE showroomId = ? AND DATE(timestamp) = ?`,
    [showroomId, today]
  );

  const [matchedResult] = await db.executeSql(
    `SELECT COUNT(*) as count
     FROM sales
     WHERE showroomId = ? AND DATE(timestamp) = ? AND status = 'matched'`,
    [showroomId, today]
  );

  return {
    totalSales: salesResult.rows.item(0).count as number,
    totalAmount: (salesResult.rows.item(0).total as number) || 0,
    matchedCount: matchedResult.rows.item(0).count as number,
  };
};

// ─── Review queue ─────────────────────────────────────────────────────────────

/**
 * Add a failed-parse SMS to the review queue for manual inspection.
 * Requirement 2.7: IF SMS parsing fails, log the failure and add to review queue.
 */
export const addToReviewQueue = async (entry: {
  id: string;
  showroomId: string;
  rawSMS: string;
  sender: string;
  timestamp: Date;
  reason?: string;
}) => {
  await db.executeSql(
    `INSERT INTO review_queue (id, showroomId, rawSMS, sender, timestamp, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.showroomId,
      entry.rawSMS,
      entry.sender,
      entry.timestamp.toISOString(),
      entry.reason ?? 'parse_failure',
    ]
  );
  return entry;
};

export const getReviewQueue = async (showroomId: string) => {
  const [result] = await db.executeSql(
    `SELECT * FROM review_queue WHERE showroomId = ? AND resolved = 0 ORDER BY createdAt ASC`,
    [showroomId]
  );
  return result.rows.raw();
};

export const resolveReviewQueueItem = async (id: string) => {
  await db.executeSql(`UPDATE review_queue SET resolved = 1 WHERE id = ?`, [id]);
};

// ─── Class-based facade (used by SMSReceiverService) ─────────────────────────

class DatabaseService {
  async createPaymentRecord(payment: {
    id?: string;
    showroomId: string;
    amount: number;
    paymentMethod: LocalPaymentRecord['paymentMethod'];
    transactionId?: string;
    sender?: string;
    rawSMS?: string;
    timestamp: Date;
    source: 'sms' | 'manual' | 'cash';
    status?: LocalPaymentRecord['status'];
    syncStatus?: LocalPaymentRecord['syncStatus'];
  }): Promise<LocalPaymentRecord> {
    const id = payment.id ?? String(uuid.v4());
    return savePayment({
      id,
      showroomId: payment.showroomId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      sender: payment.sender,
      rawSMS: payment.rawSMS,
      source: payment.source,
      timestamp: payment.timestamp.toISOString(),
      status: payment.status ?? 'unmatched',
      syncStatus: payment.syncStatus ?? 'pending',
    });
  }

  async addToUnknownQueue(entry: {
    showroomId: string;
    rawSMS: string;
    sender: string;
    timestamp: Date;
    reason?: string;
  }) {
    const id = String(uuid.v4());
    return addToReviewQueue({ id, ...entry });
  }
}

export const databaseService = new DatabaseService();
