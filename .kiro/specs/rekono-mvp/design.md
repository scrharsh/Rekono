# Design Document: Rekono MVP

## Overview

Rekono is a sale-first transaction reconciliation system designed for GST-registered showrooms in India. The system bridges the gap between physical retail transactions and digital accounting by automatically capturing UPI payment notifications via SMS, matching them with sale entries, and generating GST-compliant outputs for Tally import.

The MVP targets showrooms with ₹50L–₹5Cr annual revenue that experience high UPI transaction volumes and manual reconciliation pain. The system serves three primary user groups: showroom staff (sale entry and payment capture), freelance accountants (data cleanup), and Chartered Accountants (multi-client oversight and GST compliance).

### Core Design Principles

1. **Sale-First Architecture**: Sales are recorded first; payments are matched to sales, not vice versa
2. **Human-in-the-Loop**: Ambiguous matches require user confirmation; automation assists but doesn't replace judgment
3. **Offline-First Mobile**: Showroom staff can work without reliable internet; sync happens automatically when connected
4. **Zero-Cost MVP**: Deployment uses free tiers (Render, MongoDB Atlas, Vercel) to validate product-market fit
5. **Multi-Tenant by Design**: Single deployment serves multiple showrooms with strict data isolation
6. **GST Compliance**: All outputs meet Indian GST requirements for record-keeping and filing

### Key Technical Challenges

1. **SMS Parsing Variability**: Four UPI providers (PhonePe, Google Pay, Paytm, BHIM) use different SMS formats that change without notice
2. **Fuzzy Matching**: Matching payments to sales requires handling timing variations, amount rounding, and split payments
3. **Offline Sync Conflicts**: Mobile app must handle concurrent edits and resolve conflicts when syncing
4. **Multi-Tenant Data Isolation**: Strict separation required for CA clients while maintaining performance
5. **Invoice Number Sequencing**: GST-compliant sequential numbering across offline devices
6. **Performance at Scale**: 10,000+ transactions per showroom with sub-3-second query response

## Architecture

### System Architecture

Rekono uses a three-tier architecture with clear separation between presentation, business logic, and data persistence.

```mermaid
graph TB
    subgraph "Mobile Tier"
        MA[Store Mobile App<br/>Android/React Native]
        SMS[SMS Receiver]
        LOCAL[Local Storage<br/>SQLite]
    end
    
    subgraph "Web Tier"
        WA[Web App<br/>React/Vercel]
    end
    
    subgraph "Backend Tier"
        API[REST API<br/>Node.js/Express<br/>Render]
        AUTH[Auth Service]
        MATCH[Matching Engine]
        PARSER[SMS Parser]
        INVOICE[Invoice Generator]
        EXPORT[Export Service]
    end
    
    subgraph "Data Tier"
        DB[(MongoDB Atlas<br/>Free Tier)]
        FILES[File Storage<br/>Render Disk]
    end
    
    SMS -->|Parse| PARSER
    MA -->|Sync| API
    MA <-->|Read/Write| LOCAL
    WA -->|HTTPS| API
    API -->|Query| DB
    API -->|Store| FILES
    PARSER -->|Create| MATCH
    MATCH -->|Update| DB
    INVOICE -->|Generate| FILES
    EXPORT -->|Read| DB
```

### Technology Stack

**Mobile App (Android)**
- React Native 0.72+ for cross-platform capability (iOS future)
- SQLite for local offline storage
- React Native SMS for SMS reading permission
- React Native PDF for invoice generation
- AsyncStorage for app state persistence

**Web App**
- React 18+ with TypeScript
- TanStack Query for server state management
- Tailwind CSS for responsive UI
- Recharts for dashboard visualizations
- XLSX library for Excel export

**Backend**
- Node.js 18+ LTS
- Express.js for REST API
- MongoDB 6.0+ with Mongoose ODM
- JWT for authentication
- Bull queue for background jobs (matching, invoice generation)
- Winston for structured logging

**Deployment**
- Mobile: APK distribution (Play Store in future)
- Web: Vercel (free tier, automatic deployments)
- Backend: Render (free tier, 512MB RAM, sleeps after inactivity)
- Database: MongoDB Atlas (free tier, 512MB storage)
- File Storage: Render persistent disk (1GB free)

### Deployment Architecture

```mermaid
graph LR
    subgraph "User Devices"
        PHONE[Android Phones]
        BROWSER[Web Browsers]
    end
    
    subgraph "Vercel Edge Network"
        VERCEL[Static Web App<br/>CDN Cached]
    end
    
    subgraph "Render Cloud"
        API_SERVER[API Server<br/>Node.js]
        DISK[Persistent Disk<br/>Invoice PDFs]
    end
    
    subgraph "MongoDB Atlas"
        PRIMARY[(Primary DB<br/>Mumbai Region)]
        BACKUP[(Auto Backup<br/>Daily)]
    end
    
    PHONE -->|HTTPS| API_SERVER
    BROWSER -->|HTTPS| VERCEL
    VERCEL -->|API Calls| API_SERVER
    API_SERVER -->|Read/Write| PRIMARY
    API_SERVER -->|Store Files| DISK
    PRIMARY -.->|Replicate| BACKUP
```

### Data Flow Patterns

**Sale Entry Flow**
1. Staff creates sale entry in mobile app (offline-capable)
2. Entry stored in local SQLite with pending sync flag
3. When online, mobile app syncs to backend via REST API
4. Backend validates and stores in MongoDB
5. Matching engine triggered to find payment matches
6. Match results synced back to mobile app

**SMS Payment Capture Flow**
1. UPI payment SMS arrives on staff phone
2. SMS receiver intercepts and extracts text
3. SMS parser identifies provider and extracts fields
4. Payment record created in local SQLite
5. Sync to backend when online
6. Matching engine searches for sale entries within time window
7. Auto-match or queue for manual review

**Web Review Flow**
1. CA/Accountant logs into web app
2. Selects showroom from dashboard
3. Filters transactions by date/status
4. Reviews low-confidence matches
5. Manually confirms or adjusts matches
6. Exports to Tally format or GST summary

## Components and Interfaces

### Mobile App Components

#### SaleEntryScreen
Handles creation of sale entries in three modes: Quick, Detailed, and Session.

**Interface:**
```typescript
interface SaleEntryInput {
  mode: 'quick' | 'detailed' | 'session';
  amount: number;
  timestamp: Date;
  items?: SaleItem[];
  customer?: CustomerInfo;
  paymentMethod?: PaymentMethod;
}

interface SaleItem {
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: GSTRate; // 0, 5, 12, 18, 28
  hsnCode?: string;
}

interface CustomerInfo {
  name?: string;
  mobile?: string;
  gstin?: string;
  address?: string;
}

type PaymentMethod = 'phonepe' | 'googlepay' | 'paytm' | 'bhim' | 'bank' | 'cash';
type GSTRate = 0 | 5 | 12 | 18 | 28;
```

**Responsibilities:**
- Validate input data (amounts > 0, valid GST rates, GSTIN format)
- Calculate GST breakdown (CGST/SGST or IGST based on state)
- Store entry in local SQLite with sync pending flag
- Trigger background sync when online
- Display validation errors inline

#### SMSReceiverService
Background service that monitors incoming SMS and extracts payment information.

**Interface:**
```typescript
interface SMSMessage {
  sender: string;
  body: string;
  timestamp: Date;
}

interface ParsedPayment {
  provider: PaymentMethod;
  amount: number;
  timestamp: Date;
  senderName?: string;
  transactionId: string;
  rawSMS: string;
}

interface SMSParser {
  canParse(sms: SMSMessage): boolean;
  parse(sms: SMSMessage): ParsedPayment | null;
}
```

**Responsibilities:**
- Register broadcast receiver for SMS_RECEIVED intent
- Filter SMS by sender (known UPI provider numbers)
- Route to appropriate parser (PhonePe, GPay, Paytm, BHIM)
- Create payment record in local database
- Log parsing failures with raw SMS for review
- Trigger matching engine after payment creation

#### LocalSyncManager
Manages offline storage and synchronization with backend.

**Interface:**
```typescript
interface SyncManager {
  syncSaleEntries(): Promise<SyncResult>;
  syncPaymentRecords(): Promise<SyncResult>;
  syncMatches(): Promise<SyncResult>;
  getQueuedItems(): Promise<QueuedItem[]>;
  resolveConflict(conflict: SyncConflict): Promise<void>;
}

interface SyncResult {
  success: boolean;
  itemsSynced: number;
  conflicts: SyncConflict[];
  errors: SyncError[];
}

interface SyncConflict {
  localItem: any;
  serverItem: any;
  conflictType: 'update' | 'delete';
  resolution?: 'local' | 'server' | 'merge';
}
```

**Responsibilities:**
- Queue local changes for upload
- Download server changes and merge with local data
- Detect and resolve sync conflicts (last-write-wins for MVP)
- Retry failed syncs with exponential backoff
- Maintain sync status indicators for UI

#### InvoiceGenerator
Generates GST-compliant PDF invoices from sale entries.

**Interface:**
```typescript
interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  showroom: ShowroomInfo;
  customer: CustomerInfo;
  items: SaleItem[];
  taxBreakdown: TaxBreakdown;
  totalAmount: number;
}

interface TaxBreakdown {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

interface InvoiceGenerator {
  generate(data: InvoiceData): Promise<string>; // Returns file path
  share(filePath: string, method: 'whatsapp' | 'email'): Promise<void>;
}
```

**Responsibilities:**
- Format invoice data according to GST requirements
- Generate PDF with proper layout and branding
- Assign sequential invoice numbers (fetch from server)
- Store PDF locally and sync to server
- Provide sharing via WhatsApp or email

### Backend Components

#### MatchingEngine
Core business logic for associating payments with sales.

**Interface:**
```typescript
interface MatchingEngine {
  findMatches(payment: PaymentRecord): Promise<MatchCandidate[]>;
  confirmMatch(paymentId: string, saleId: string, userId: string): Promise<Match>;
  calculateConfidence(payment: PaymentRecord, sale: SaleEntry): number;
  processUnmatchedQueue(): Promise<void>;
}

interface MatchCandidate {
  saleEntry: SaleEntry;
  confidence: number; // 0-100
  reason: string;
}

interface Match {
  id: string;
  paymentId: string;
  saleId: string;
  confidence: number;
  status: 'auto' | 'manual' | 'verified';
  matchedBy?: string; // userId
  matchedAt: Date;
}
```

**Matching Algorithm:**
1. Search for sales within ±30 minutes of payment timestamp
2. Filter by exact amount match (±₹1 tolerance for rounding)
3. Calculate confidence score:
   - Exact amount + within 5 min = 95 confidence
   - Exact amount + within 15 min = 85 confidence
   - Exact amount + within 30 min = 70 confidence
   - Amount ±₹1 + within 15 min = 60 confidence
4. If confidence ≥ 90 and only one match: auto-match
5. If confidence < 90 or multiple matches: queue for manual review
6. If no matches: add to unknown queue

**Responsibilities:**
- Execute matching logic on new payments
- Maintain unmatched and unknown queues
- Support manual match confirmation
- Handle split payment scenarios
- Calculate and store confidence scores

#### SMSParserService
Server-side SMS parsing with provider-specific parsers.

**Provider Patterns (Regex):**

```typescript
const PARSER_PATTERNS = {
  phonepe: {
    sender: /PhonePe|PHONEPE/,
    amount: /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /Ref\s*(?:ID|No)?\s*:?\s*(\w+)/i,
    timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  },
  googlepay: {
    sender: /GOOGLEPAY|Google\s*Pay/i,
    amount: /(?:Rs|INR)\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /UPI\s*(?:Ref|ID)\s*:?\s*(\w+)/i,
    timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  },
  paytm: {
    sender: /PAYTM|PayTM/i,
    amount: /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /Order\s*(?:ID|No)\s*:?\s*(\w+)/i,
    timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  },
  bhim: {
    sender: /BHIM|UPI/i,
    amount: /(?:Rs|INR)\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    transactionId: /(?:Ref|UPI)\s*(?:No|ID)\s*:?\s*(\w+)/i,
    timestamp: /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  },
};
```

**Responsibilities:**
- Identify payment provider from SMS sender/content
- Extract structured data using regex patterns
- Handle parsing failures gracefully
- Log raw SMS for failed parses
- Normalize amounts (remove commas, parse decimals)
- Normalize timestamps to ISO format

#### ExportService
Generates Tally-ready Excel exports and GST summaries.

**Interface:**
```typescript
interface ExportService {
  generateTallyExport(showroomId: string, dateRange: DateRange): Promise<Buffer>;
  generateGSTSummary(showroomId: string, dateRange: DateRange): Promise<GSTSummary>;
}

interface TallyExportRow {
  date: string;
  voucherType: 'Sales' | 'Receipt';
  ledgerName: string;
  amount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  narration: string;
}

interface GSTSummary {
  period: DateRange;
  byRate: {
    [rate: number]: {
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      transactionCount: number;
    };
  };
  totals: {
    taxableAmount: number;
    totalTax: number;
    transactionCount: number;
  };
}
```

**Tally Export Format:**
- Column headers: Date, Voucher Type, Ledger, Amount, GST%, CGST, SGST, IGST, Narration
- Group by date and voucher type
- Include only verified matches
- Format dates as DD-MM-YYYY
- Format amounts with 2 decimal places

**Responsibilities:**
- Query matched transactions for date range
- Transform to Tally-compatible format
- Calculate GST summaries by rate
- Generate Excel files using XLSX library
- Validate totals match individual transactions

#### AuthService
Handles authentication and role-based authorization.

**Interface:**
```typescript
interface AuthService {
  login(username: string, password: string): Promise<AuthToken>;
  verifyToken(token: string): Promise<User>;
  checkPermission(user: User, resource: string, action: string): boolean;
}

interface User {
  id: string;
  username: string;
  role: 'staff' | 'accountant' | 'ca' | 'admin';
  showroomIds: string[]; // Accessible showrooms
  email?: string;
}

interface AuthToken {
  token: string;
  expiresAt: Date;
  user: User;
}
```

**Role Permissions:**
- **Staff**: Read/write own showroom sales and payments
- **Accountant**: Read/write assigned showroom transactions, no GST filing
- **CA**: Read all assigned showrooms, GST summaries, client management
- **Admin**: Full system access, user management, marketplace assignment

**Responsibilities:**
- Validate credentials against database
- Generate JWT tokens with role and showroom claims
- Verify token signatures and expiration
- Enforce role-based access control
- Lock accounts after 3 failed login attempts

### Web App Components

#### DashboardView
CA overview of all client showrooms with key metrics.

**Interface:**
```typescript
interface DashboardData {
  showrooms: ShowroomSummary[];
  filters: {
    matchRate?: 'low' | 'medium' | 'high';
    unresolvedItems?: 'any' | 'high';
    transactionVolume?: 'low' | 'medium' | 'high';
  };
}

interface ShowroomSummary {
  id: string;
  name: string;
  gstin: string;
  transactionCount: number;
  autoMatchRate: number; // 0-100
  unmatchedCount: number;
  unknownCount: number;
  lastActivity: Date;
}
```

**Responsibilities:**
- Fetch and display showroom summaries
- Apply filters and sorting
- Navigate to detailed transaction view
- Refresh metrics every 5 minutes
- Highlight showrooms needing attention

#### TransactionListView
Detailed transaction view with filtering and manual matching.

**Interface:**
```typescript
interface TransactionListProps {
  showroomId: string;
  filters: TransactionFilters;
  onMatchConfirm: (paymentId: string, saleId: string) => void;
  onFilterChange: (filters: TransactionFilters) => void;
}

interface TransactionFilters {
  dateRange?: DateRange;
  amountRange?: { min: number; max: number };
  matchStatus?: 'matched' | 'unmatched' | 'unknown';
  paymentMethod?: PaymentMethod;
  gstRate?: GSTRate;
  confidenceThreshold?: number;
}

interface TransactionRow {
  sale?: SaleEntry;
  payment?: PaymentRecord;
  match?: Match;
  confidence?: number;
}
```

**Responsibilities:**
- Display paginated transaction list (50 per page)
- Apply filters and update URL query params
- Show match confidence indicators
- Allow manual match confirmation
- Display full transaction details in modal
- Add notes to transactions

#### ExportView
Generate and download Tally exports and GST summaries.

**Interface:**
```typescript
interface ExportViewProps {
  showroomId: string;
  onExport: (type: 'tally' | 'gst', dateRange: DateRange) => void;
}

interface ExportOptions {
  type: 'tally' | 'gst';
  dateRange: DateRange;
  includeUnverified: boolean;
  format: 'xlsx' | 'csv';
}
```

**Responsibilities:**
- Provide date range picker
- Validate date ranges (max 1 year)
- Trigger export generation
- Download generated files
- Display export progress
- Show preview of export data

## Data Models

### Core Entities

#### SaleEntry
```typescript
interface SaleEntry {
  id: string;
  showroomId: string;
  invoiceNumber?: string;
  timestamp: Date;
  mode: 'quick' | 'detailed' | 'session';
  
  // Financial
  totalAmount: number;
  taxableAmount: number;
  totalTax: number;
  
  // Items
  items: SaleItem[];
  
  // Customer
  customer?: CustomerInfo;
  
  // Status
  status: 'pending' | 'matched' | 'partial' | 'complete';
  matchedPaymentIds: string[];
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
  deviceId?: string;
}
```

#### PaymentRecord
```typescript
interface PaymentRecord {
  id: string;
  showroomId: string;
  
  // Payment details
  amount: number;
  timestamp: Date;
  method: PaymentMethod;
  provider?: string; // PhonePe, Google Pay, etc.
  transactionId?: string;
  senderName?: string;
  
  // Source
  source: 'sms' | 'manual';
  rawSMS?: string;
  
  // Status
  status: 'unmatched' | 'matched' | 'verified';
  matchedSaleId?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced';
  deviceId?: string;
}
```

#### Match
```typescript
interface Match {
  id: string;
  showroomId: string;
  
  // Association
  saleId: string;
  paymentId: string;
  
  // Confidence
  confidence: number; // 0-100
  matchType: 'auto' | 'manual';
  
  // Verification
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

#### Showroom
```typescript
interface Showroom {
  id: string;
  name: string;
  gstin: string;
  
  // Contact
  ownerName: string;
  mobile: string;
  email?: string;
  address: Address;
  
  // Business
  stateCode: string; // For CGST/SGST vs IGST
  invoicePrefix: string;
  lastInvoiceNumber: number;
  
  // Access
  staffUserIds: string[];
  caUserId?: string;
  accountantUserIds: string[];
  
  // Status
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

#### User
```typescript
interface User {
  id: string;
  username: string;
  passwordHash: string;
  
  // Profile
  fullName: string;
  email?: string;
  mobile?: string;
  
  // Role
  role: 'staff' | 'accountant' | 'ca' | 'admin';
  showroomIds: string[]; // Accessible showrooms
  
  // Security
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Indexes

**MongoDB Indexes for Performance:**

```javascript
// SaleEntry indexes
db.saleEntries.createIndex({ showroomId: 1, timestamp: -1 });
db.saleEntries.createIndex({ showroomId: 1, status: 1 });
db.saleEntries.createIndex({ showroomId: 1, totalAmount: 1, timestamp: 1 });
db.saleEntries.createIndex({ invoiceNumber: 1 }, { unique: true, sparse: true });

// PaymentRecord indexes
db.paymentRecords.createIndex({ showroomId: 1, timestamp: -1 });
db.paymentRecords.createIndex({ showroomId: 1, status: 1 });
db.paymentRecords.createIndex({ showroomId: 1, amount: 1, timestamp: 1 });
db.paymentRecords.createIndex({ transactionId: 1 }, { sparse: true });

// Match indexes
db.matches.createIndex({ showroomId: 1, createdAt: -1 });
db.matches.createIndex({ saleId: 1 });
db.matches.createIndex({ paymentId: 1 });
db.matches.createIndex({ showroomId: 1, confidence: 1 });

// User indexes
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ role: 1, showroomIds: 1 });

// Showroom indexes
db.showrooms.createIndex({ gstin: 1 }, { unique: true });
db.showrooms.createIndex({ caUserId: 1 });
```

### Data Relationships

```mermaid
erDiagram
    Showroom ||--o{ SaleEntry : has
    Showroom ||--o{ PaymentRecord : has
    Showroom ||--o{ Match : has
    Showroom ||--o{ User : employs
    User ||--o{ SaleEntry : creates
    User ||--o{ PaymentRecord : creates
    User ||--o{ Match : verifies
    SaleEntry ||--o| Match : matched_by
    PaymentRecord ||--o| Match : matched_by
    
    Showroom {
        string id PK
        string gstin UK
        string name
        string caUserId FK
    }
    
    SaleEntry {
        string id PK
        string showroomId FK
        number totalAmount
        datetime timestamp
        string status
    }
    
    PaymentRecord {
        string id PK
        string showroomId FK
        number amount
        datetime timestamp
        string status
    }
    
    Match {
        string id PK
        string showroomId FK
        string saleId FK
        string paymentId FK
        number confidence
    }
    
    User {
        string id PK
        string username UK
        string role
        array showroomIds
    }
```

### Data Validation Rules

**SaleEntry Validation:**
- `totalAmount` must be > 0
- `items` array must not be empty in detailed mode
- Each `item.gstRate` must be in [0, 5, 12, 18, 28]
- `customer.gstin` must match pattern: `\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}`
- `customer.mobile` must match pattern: `[6-9]\d{9}`
- Sum of item amounts must equal totalAmount (±₹1 tolerance)

**PaymentRecord Validation:**
- `amount` must be > 0
- `timestamp` must not be in future
- `method` must be valid PaymentMethod enum value
- `transactionId` required if source is 'sms'
- `rawSMS` required if source is 'sms'

**Match Validation:**
- `confidence` must be between 0 and 100
- `saleId` must reference existing SaleEntry
- `paymentId` must reference existing PaymentRecord
- Both sale and payment must belong to same showroom
- Payment amount must be ≤ sale amount (for split payments)

**Showroom Validation:**
- `gstin` must be unique and match GST format
- `stateCode` must be valid 2-digit Indian state code
- `invoicePrefix` must be 2-4 uppercase letters
- `mobile` must match Indian mobile pattern

**User Validation:**
- `username` must be unique
- `passwordHash` must be bcrypt hash
- `role` must be valid enum value
- `showroomIds` must reference existing showrooms
- Staff users must have exactly 1 showroom
- CA/Accountant users can have multiple showrooms


## API Design

### REST API Endpoints

**Base URL:** `https://api.rekono.app/v1`

**Authentication:** All endpoints except `/auth/login` require JWT token in `Authorization: Bearer <token>` header.

#### Authentication Endpoints

```
POST /auth/login
Request: { username: string, password: string }
Response: { token: string, expiresAt: string, user: User }
Status: 200 OK | 401 Unauthorized | 423 Locked (account locked)

POST /auth/refresh
Request: { token: string }
Response: { token: string, expiresAt: string }
Status: 200 OK | 401 Unauthorized

POST /auth/logout
Request: { token: string }
Response: { success: boolean }
Status: 200 OK
```

#### Sale Entry Endpoints

```
POST /showrooms/:showroomId/sales
Request: SaleEntryInput
Response: { sale: SaleEntry }
Status: 201 Created | 400 Bad Request | 403 Forbidden

GET /showrooms/:showroomId/sales
Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=pending|matched&limit=50&offset=0
Response: { sales: SaleEntry[], total: number, hasMore: boolean }
Status: 200 OK | 403 Forbidden

GET /showrooms/:showroomId/sales/:saleId
Response: { sale: SaleEntry, payment?: PaymentRecord, match?: Match }
Status: 200 OK | 404 Not Found | 403 Forbidden

PATCH /showrooms/:showroomId/sales/:saleId
Request: Partial<SaleEntry>
Response: { sale: SaleEntry }
Status: 200 OK | 400 Bad Request | 404 Not Found | 403 Forbidden

DELETE /showrooms/:showroomId/sales/:saleId
Response: { success: boolean }
Status: 200 OK | 404 Not Found | 403 Forbidden
```

#### Payment Record Endpoints

```
POST /showrooms/:showroomId/payments
Request: { amount: number, timestamp: string, method: PaymentMethod, source: 'sms'|'manual', rawSMS?: string, transactionId?: string }
Response: { payment: PaymentRecord, matches?: MatchCandidate[] }
Status: 201 Created | 400 Bad Request | 403 Forbidden

GET /showrooms/:showroomId/payments
Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=unmatched|matched&method=phonepe|googlepay&limit=50&offset=0
Response: { payments: PaymentRecord[], total: number, hasMore: boolean }
Status: 200 OK | 403 Forbidden

GET /showrooms/:showroomId/payments/:paymentId
Response: { payment: PaymentRecord, sale?: SaleEntry, match?: Match }
Status: 200 OK | 404 Not Found | 403 Forbidden
```

#### Matching Endpoints

```
POST /showrooms/:showroomId/matches
Request: { saleId: string, paymentId: string, notes?: string }
Response: { match: Match }
Status: 201 Created | 400 Bad Request | 403 Forbidden | 409 Conflict (already matched)

GET /showrooms/:showroomId/matches
Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&minConfidence=0-100&limit=50&offset=0
Response: { matches: Match[], total: number, hasMore: boolean }
Status: 200 OK | 403 Forbidden

GET /showrooms/:showroomId/matches/suggestions/:paymentId
Response: { candidates: MatchCandidate[] }
Status: 200 OK | 404 Not Found | 403 Forbidden

DELETE /showrooms/:showroomId/matches/:matchId
Request: { reason: string }
Response: { success: boolean }
Status: 200 OK | 404 Not Found | 403 Forbidden
```

#### Queue Endpoints

```
GET /showrooms/:showroomId/queues/unmatched
Query: ?limit=50&offset=0
Response: { sales: SaleEntry[], total: number, hasMore: boolean }
Status: 200 OK | 403 Forbidden

GET /showrooms/:showroomId/queues/unknown
Query: ?limit=50&offset=0
Response: { payments: PaymentRecord[], total: number, hasMore: boolean }
Status: 200 OK | 403 Forbidden
```

#### Export Endpoints

```
POST /showrooms/:showroomId/exports/tally
Request: { startDate: string, endDate: string, includeUnverified: boolean }
Response: Binary Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
Status: 200 OK | 400 Bad Request | 403 Forbidden

POST /showrooms/:showroomId/exports/gst-summary
Request: { startDate: string, endDate: string }
Response: { summary: GSTSummary }
Status: 200 OK | 400 Bad Request | 403 Forbidden
```

#### Invoice Endpoints

```
POST /showrooms/:showroomId/invoices
Request: { saleId: string }
Response: { invoiceNumber: string, pdfUrl: string }
Status: 201 Created | 400 Bad Request | 403 Forbidden

GET /showrooms/:showroomId/invoices/:invoiceNumber
Response: Binary PDF file (application/pdf)
Status: 200 OK | 404 Not Found | 403 Forbidden

GET /showrooms/:showroomId/invoices
Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=50&offset=0
Response: { invoices: InvoiceMetadata[], total: number, hasMore: boolean }
Status: 200 OK | 403 Forbidden
```

#### Dashboard Endpoints (CA/Accountant)

```
GET /dashboard/showrooms
Response: { showrooms: ShowroomSummary[] }
Status: 200 OK | 403 Forbidden

GET /dashboard/showrooms/:showroomId/summary
Response: { summary: ShowroomDetailSummary }
Status: 200 OK | 404 Not Found | 403 Forbidden

GET /dashboard/metrics
Response: { 
  totalShowrooms: number,
  totalTransactions: number,
  avgAutoMatchRate: number,
  showroomsNeedingAttention: number
}
Status: 200 OK | 403 Forbidden
```

#### Sync Endpoints (Mobile)

```
POST /sync/batch
Request: {
  sales: SaleEntry[],
  payments: PaymentRecord[],
  matches: Match[],
  lastSyncTimestamp: string
}
Response: {
  serverUpdates: {
    sales: SaleEntry[],
    payments: PaymentRecord[],
    matches: Match[]
  },
  conflicts: SyncConflict[],
  syncTimestamp: string
}
Status: 200 OK | 400 Bad Request | 403 Forbidden
```

### API Error Responses

All error responses follow this format:

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}
```

**Common Error Codes:**
- `AUTH_REQUIRED`: Missing or invalid authentication token
- `FORBIDDEN`: User lacks permission for this resource
- `NOT_FOUND`: Resource does not exist
- `VALIDATION_ERROR`: Request data failed validation
- `CONFLICT`: Operation conflicts with existing data
- `RATE_LIMIT`: Too many requests
- `SERVER_ERROR`: Internal server error

**Example Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid sale entry data",
    "details": {
      "field": "totalAmount",
      "issue": "Must be greater than 0"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Rate Limiting

**Limits per user:**
- Authentication endpoints: 5 requests per minute
- Read endpoints: 100 requests per minute
- Write endpoints: 30 requests per minute
- Export endpoints: 10 requests per hour

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642248600
```

### API Versioning

- Version included in URL path: `/v1/`
- Breaking changes require new version
- Old versions supported for 6 months after deprecation notice
- Deprecation communicated via `X-API-Deprecated` header

### Webhook Support (Future)

Planned webhook events for real-time integrations:
- `sale.created`
- `payment.received`
- `match.confirmed`
- `invoice.generated`
- `export.completed`



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sale Entry Timestamp Assignment

*For any* sale entry created in the system, the entry shall have a timestamp that is set to the current date and time at creation.

**Validates: Requirements 1.4**

### Property 2: GST Calculation Correctness

*For any* sale entry in detailed mode with items having GST rates, the calculated GST amounts (CGST, SGST, or IGST) shall equal the sum of (item amount × GST rate) for all items, within ₹1 tolerance for rounding.

**Validates: Requirements 1.5**

### Property 3: Unique Sale Entry Identifiers

*For any* two sale entries created in the system, their assigned identifiers shall be distinct.

**Validates: Requirements 1.7**

### Property 4: Multi-Item GST Rate Support

*For any* sale entry containing multiple items with different GST rates, the system shall correctly store and calculate tax for each item according to its individual rate.

**Validates: Requirements 1.8**

### Property 5: SMS Payment Parsing Completeness

*For any* valid payment SMS from supported providers (PhonePe, Google Pay, Paytm, BHIM), the parser shall extract all required fields: transaction amount, timestamp, sender name, and transaction ID.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 6: Payment Record Creation from Parsed SMS

*For any* successfully parsed SMS payment, a payment record shall be created containing all extracted data fields.

**Validates: Requirements 2.6**

### Property 7: SMS Parsing Failure Handling

*For any* SMS that fails to parse, the system shall log the failure and add the raw SMS to a review queue.

**Validates: Requirements 2.7**

### Property 8: Cash Payment Validation

*For any* cash payment entry, the system shall require both amount and timestamp fields to be present and valid.

**Validates: Requirements 3.2**

### Property 9: Cash Payment Method Tagging

*For any* cash payment record created, the payment method field shall be set to 'cash' and include a manual entry indicator.

**Validates: Requirements 3.3, 3.5**

### Property 10: Payment Matching Time Window

*For any* payment record created, the matching engine shall search for sale entries with matching amounts within a ±30 minute time window of the payment timestamp.

**Validates: Requirements 4.1**

### Property 11: Automatic High-Confidence Matching

*For any* payment record that has exactly one sale entry match with exact amount and within 5 minutes, the matching engine shall automatically associate them and assign confidence ≥ 90.

**Validates: Requirements 4.2**

### Property 12: Ambiguous Match Handling

*For any* payment record that has multiple sale entry matches, the matching engine shall present all candidates and assign confidence < 90.

**Validates: Requirements 4.3**

### Property 13: Unknown Payment Queue Addition

*For any* payment record that has no matching sale entries within the time window, the system shall add the payment to the unknown queue.

**Validates: Requirements 4.4**

### Property 14: Unmatched Sale Queue Addition

*For any* sale entry that has no matching payment record after 60 minutes, the system shall add the sale to the unmatched queue.

**Validates: Requirements 4.5**

### Property 15: Confidence Score Bounds

*For any* match suggestion generated by the matching engine, the confidence indicator score shall be between 0 and 100 inclusive.

**Validates: Requirements 4.6**

### Property 16: Manual Match Verification

*For any* manually confirmed match, the system shall update the association status to 'user-verified' and record the user who confirmed it.

**Validates: Requirements 4.7**

### Property 17: Matching Preserves Original Data

*For any* matched pair of sale entry and payment record, the original data in both records shall remain unmodified after matching.

**Validates: Requirements 4.9**

### Property 18: Split Payment Component Tracking

*For any* sale entry marked as split payment, the system shall track each associated payment record separately and maintain the association.

**Validates: Requirements 5.2**

### Property 19: Split Payment Completion Detection

*For any* sale entry with split payments, when all payment records are matched and their sum equals the sale amount (±₹1 tolerance), the system shall mark the sale as fully paid.

**Validates: Requirements 5.3, 5.4**

### Property 20: Split Payment Discrepancy Flagging

*For any* sale entry with split payments where the sum of payment amounts does not equal the sale amount (beyond ±₹1 tolerance), the system shall flag the discrepancy for review.

**Validates: Requirements 5.5**

### Property 21: Invoice Required Fields Completeness

*For any* generated invoice PDF, the document shall include all required GST fields: showroom GSTIN, invoice number, invoice date, customer details, item descriptions, HSN codes, taxable amounts, GST rates, GST amounts, and total amount.

**Validates: Requirements 6.1, 6.2**

### Property 22: Invoice Number Sequencing

*For any* two invoices generated for the same showroom, if invoice A is generated before invoice B, then invoice A's number shall be less than invoice B's number.

**Validates: Requirements 6.3**

### Property 23: Invoice Storage and Retrieval

*For any* generated invoice PDF, storing the invoice then retrieving it by invoice number shall return the same PDF content.

**Validates: Requirements 6.5**

### Property 24: Invoice Data Round-Trip

*For any* sale entry with valid data, generating an invoice PDF then parsing the PDF data shall produce sale information equivalent to the original entry.

**Validates: Requirements 6.6**

### Property 25: Queue Sorting by Age

*For any* set of items in the unmatched queue or unknown queue, the items shall be sorted with oldest entries first based on creation timestamp.

**Validates: Requirements 7.3, 7.4**

### Property 26: Queue Item Removal on Resolution

*For any* queue item that is resolved (matched or dismissed), the item shall be removed from the queue immediately.

**Validates: Requirements 7.7**

### Property 27: Transaction Sorting Correctness

*For any* transaction list sorted by date, amount, or confidence, the resulting order shall satisfy the sorting criterion (ascending or descending as specified).

**Validates: Requirements 19.4**

### Property 28: Tally Export Column Completeness

*For any* generated Tally export file, the file shall include all required columns: date, voucher type, ledger name, amount, GST rate, CGST, SGST, IGST, and narration.

**Validates: Requirements 20.2**

### Property 29: Tally Export Filtering

*For any* Tally export request, the generated file shall include only transactions that are matched and verified, excluding unmatched or unverified transactions.

**Validates: Requirements 20.3**

### Property 30: Tally Export Grouping

*For any* set of transactions in a Tally export, the transactions shall be grouped by date and voucher type.

**Validates: Requirements 20.6**

### Property 31: Tally Export Financial Round-Trip

*For any* set of exported transactions, the sum of financial totals (taxable amount, GST amounts, total amount) in the Tally export shall equal the sum of the same fields in the source transactions within ₹1 tolerance per showroom.

**Validates: Requirements 20.7**

### Property 32: GST Summary Completeness

*For any* generated GST summary, the summary shall include breakdowns for all GST rates (0%, 5%, 12%, 18%, 28%) with separate CGST, SGST, and IGST amounts, plus taxable amount, tax amount, and total amount for each rate.

**Validates: Requirements 21.1, 21.2, 21.4**

### Property 33: GST Summary Accuracy

*For any* GST summary generated for a date range, the summary totals shall match the sum of individual transaction GST amounts within ₹1 tolerance.

**Validates: Requirements 21.6**

### Property 34: Authentication Credential Verification

*For any* login attempt, the system shall verify the provided credentials against stored user records and return success only if credentials match.

**Validates: Requirements 23.3**

### Property 35: User Role Assignment

*For any* user in the system, the user shall have exactly one role from the set: showroom staff, accountant, CA, or admin.

**Validates: Requirements 23.4**

### Property 36: Role-Based Access Control

*For any* user accessing showroom data, the system shall restrict access based on role: staff users see only their assigned showroom, accountants see only assigned showrooms, CAs see all assigned showrooms with CA features, and admins see all data.

**Validates: Requirements 23.5, 23.6, 23.7, 23.8**

### Property 37: Account Lockout on Failed Attempts

*For any* user account with three consecutive failed login attempts, the system shall lock the account for 15 minutes.

**Validates: Requirements 23.9**

### Property 38: Database Write Retry Logic

*For any* database write operation that fails, the system shall retry the operation up to 3 times before alerting the user.

**Validates: Requirements 24.6**

### Property 39: Offline Data Storage

*For any* sale entry or payment record created when the mobile app is offline, the data shall be stored locally on the device with a pending sync flag.

**Validates: Requirements 25.1, 25.2**

### Property 40: Sync Retry on Failure

*For any* synchronization attempt that fails, the mobile app shall retry every 5 minutes until successful.

**Validates: Requirements 25.6**

### Property 41: Error Logging Completeness

*For any* error that occurs in the system, an error log entry shall be created containing timestamp, user ID, operation attempted, and error message.

**Validates: Requirements 27.3**

### Property 42: Critical Error Alerting

*For any* critical error that occurs, the system shall send an alert notification to admin users.

**Validates: Requirements 27.5**

### Property 43: SMS Parsing Failure Logging

*For any* SMS that fails to parse, the system shall log the complete raw SMS content for manual review.

**Validates: Requirements 27.6**

### Property 44: Amount Validation

*For any* sale entry or payment record, the system shall reject amounts that are less than or equal to zero.

**Validates: Requirements 28.1**

### Property 45: GST Rate Validation

*For any* GST rate entered, the system shall accept only values from the set {0, 5, 12, 18, 28} and reject all other values.

**Validates: Requirements 28.2**

### Property 46: GSTIN Format Validation

*For any* GSTIN entered, the system shall verify the format matches the 15-character GST identification pattern and reject invalid formats.

**Validates: Requirements 28.3**

### Property 47: Mobile Number Format Validation

*For any* mobile number entered, the system shall verify the format is a valid 10-digit Indian mobile number starting with 6-9 and reject invalid formats.

**Validates: Requirements 28.4**

### Property 48: Validation Error Messaging

*For any* validation failure, the system shall display an error message that specifically identifies which field is invalid and why.

**Validates: Requirements 28.5**

### Property 49: Invalid Data Prevention

*For any* sale entry or payment record with validation errors, the system shall prevent saving the record until all validation errors are resolved.

**Validates: Requirements 28.6**

### Property 50: Payment Method Categorization

*For any* payment record created, the system shall categorize it by payment method as one of: PhonePe, Google Pay, Paytm, BHIM, bank transfer, or cash.

**Validates: Requirements 29.1**

### Property 51: Tally Export Payment Method Inclusion

*For any* transaction in a Tally export, the export shall include the payment method information.

**Validates: Requirements 29.3**

### Property 52: SMS Payment Provider Identification

*For any* payment record created from SMS, the SMS parser shall identify and tag the payment provider.

**Validates: Requirements 29.5**



## Error Handling

### Error Categories

**Validation Errors**
- User input fails format or business rule validation
- Handled at input boundary before persistence
- Return specific error messages to user
- Examples: negative amounts, invalid GSTIN format, unsupported GST rate

**Network Errors**
- Mobile app cannot reach backend API
- Web app loses connection during operation
- Handled with retry logic and offline fallback
- Examples: timeout, connection refused, DNS failure

**Parsing Errors**
- SMS content doesn't match expected patterns
- Provider changed SMS format
- Handled by logging raw SMS and queuing for manual review
- Examples: missing amount field, unrecognized sender, malformed date

**Matching Errors**
- Ambiguous matches (multiple candidates)
- No matches found
- Amount discrepancies in split payments
- Handled by queuing for manual resolution
- Examples: three sales at same amount within 5 minutes, payment with no corresponding sale

**Authentication Errors**
- Invalid credentials
- Expired tokens
- Insufficient permissions
- Handled by returning 401/403 status and requiring re-authentication
- Examples: wrong password, token expired, staff user accessing CA features

**Database Errors**
- Write failures
- Connection pool exhausted
- Query timeouts
- Handled with retry logic (up to 3 attempts) and admin alerts
- Examples: MongoDB connection lost, disk full, index corruption

**File System Errors**
- Invoice PDF generation fails
- Export file cannot be written
- Disk space exhausted
- Handled by returning error to user and logging for admin review
- Examples: PDF library crash, no write permission, disk full

### Error Handling Strategies

**Graceful Degradation**
- Mobile app continues working offline when backend unavailable
- Web app shows cached data when API slow or unavailable
- Matching engine queues ambiguous cases rather than failing

**Retry with Exponential Backoff**
- Database writes: 3 retries with 1s, 2s, 4s delays
- API calls from mobile: 5 retries with 2s, 4s, 8s, 16s, 32s delays
- Sync operations: infinite retries every 5 minutes until success

**User-Friendly Error Messages**
- Technical errors translated to plain language
- Actionable guidance provided ("Check your internet connection")
- Error codes included for support reference

**Logging and Monitoring**
- All errors logged with context (user, operation, timestamp)
- Critical errors trigger admin alerts
- Error rates tracked in metrics dashboard

**Fallback Mechanisms**
- SMS parsing failure → manual entry form
- Auto-match failure → manual match queue
- Invoice generation failure → retry with simplified template
- Export generation failure → offer CSV instead of Excel

### Error Response Format

**API Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid sale entry data",
    "details": {
      "field": "totalAmount",
      "issue": "Must be greater than 0",
      "provided": -100
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**Mobile App Error Display:**
- Toast notification for transient errors (network timeout)
- Modal dialog for errors requiring user action (validation failure)
- Inline field errors for form validation
- Persistent banner for offline mode

**Web App Error Display:**
- Toast notification for background operations (export complete)
- Modal dialog for critical errors (authentication failure)
- Inline field errors for form validation
- Error boundary for React component crashes

### Error Recovery Procedures

**SMS Parsing Failure Recovery:**
1. Log raw SMS content to database
2. Add to manual review queue
3. Notify staff via in-app notification
4. Staff can manually create payment record from SMS

**Sync Conflict Recovery:**
1. Detect conflict (same record modified on device and server)
2. Apply last-write-wins strategy for MVP
3. Log conflict details for audit
4. Future: present conflict resolution UI to user

**Invoice Number Collision Recovery:**
1. Detect duplicate invoice number attempt
2. Fetch latest invoice number from server
3. Retry generation with correct sequence number
4. If retry fails, alert admin and block invoice generation

**Database Connection Loss Recovery:**
1. Detect connection failure
2. Attempt reconnection with exponential backoff
3. Queue write operations in memory
4. Flush queue when connection restored
5. If queue exceeds 1000 items, alert admin and reject new writes

**Export Generation Timeout Recovery:**
1. Detect timeout (>30 seconds for export)
2. Cancel current export job
3. Suggest smaller date range to user
4. Offer to email export when complete (background job)

## Testing Strategy

### Dual Testing Approach

Rekono employs both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, special characters)
- Error conditions and exception handling
- Integration points between components
- UI component rendering and user interactions

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must be preserved across operations
- Round-trip properties (serialize/deserialize, parse/format)
- Relationship properties (summary equals sum of parts)

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Framework Selection:**
- JavaScript/TypeScript: **fast-check** library
- Reason: Mature, well-documented, integrates with Jest/Vitest
- Minimum 100 iterations per property test (due to randomization)

**Test Tagging Convention:**
Each property-based test must include a comment tag referencing the design document property:

```typescript
// Feature: rekono-mvp, Property 2: GST Calculation Correctness
test('GST calculation matches sum of item taxes', () => {
  fc.assert(
    fc.property(
      fc.array(arbitraryItem(), { minLength: 1, maxLength: 10 }),
      (items) => {
        const sale = createSaleEntry({ items, mode: 'detailed' });
        const expectedGST = items.reduce((sum, item) => 
          sum + (item.amount * item.gstRate / 100), 0
        );
        expect(Math.abs(sale.totalTax - expectedGST)).toBeLessThanOrEqual(1);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Generator Strategy:**
- Create custom arbitraries for domain objects (SaleEntry, PaymentRecord, etc.)
- Use realistic constraints (amounts 1-100000, dates within last year)
- Include edge cases in generators (zero GST rate, split payments)
- Shrink to minimal failing example on test failure

### Test Coverage Targets

**Unit Test Coverage:**
- Line coverage: ≥80%
- Branch coverage: ≥75%
- Function coverage: ≥85%

**Property Test Coverage:**
- Each correctness property from design document: 1 property test
- Total: 52 property tests (one per property)

**Integration Test Coverage:**
- API endpoints: 100% (all endpoints tested)
- Authentication flows: 100% (all role combinations)
- Matching engine scenarios: ≥90% (common and edge cases)

### Testing Layers

**Layer 1: Unit Tests (Component Level)**

*Mobile App Components:*
- SaleEntryScreen: form validation, mode switching, GST calculation
- SMSReceiverService: SMS filtering, parser routing
- LocalSyncManager: queue management, conflict detection
- InvoiceGenerator: PDF generation, number sequencing

*Backend Components:*
- MatchingEngine: confidence scoring, queue management
- SMSParserService: pattern matching for each provider
- ExportService: Tally format generation, GST summary calculation
- AuthService: credential verification, token generation

*Web App Components:*
- DashboardView: data fetching, filtering, sorting
- TransactionListView: pagination, match confirmation
- ExportView: date range validation, file download

**Layer 2: Property-Based Tests (Business Logic)**

*Matching Engine Properties:*
- Property 10: Time window search
- Property 11: Auto-match high confidence
- Property 17: Data preservation during matching

*GST Calculation Properties:*
- Property 2: GST calculation correctness
- Property 32: GST summary completeness
- Property 33: GST summary accuracy

*Validation Properties:*
- Property 44: Amount validation
- Property 45: GST rate validation
- Property 46: GSTIN format validation
- Property 47: Mobile number validation

*Round-Trip Properties:*
- Property 24: Invoice data round-trip
- Property 31: Tally export financial round-trip

**Layer 3: Integration Tests (API Level)**

*Authentication Flow:*
- Login with valid credentials → returns token
- Login with invalid credentials → returns 401
- Access protected endpoint without token → returns 401
- Access resource outside role permissions → returns 403
- Three failed logins → account locked

*Sale Entry Flow:*
- Create sale → returns 201 with sale ID
- Create sale with invalid data → returns 400 with validation errors
- Fetch sale by ID → returns sale data
- Update sale → returns updated sale
- Delete sale → sale no longer fetchable

*Matching Flow:*
- Create payment → triggers matching engine
- Payment with unique match → auto-matched
- Payment with multiple matches → queued with candidates
- Manual match confirmation → updates both records
- Unmatched sale after 60 min → added to queue

*Export Flow:*
- Request Tally export → returns Excel file
- Export includes only verified transactions
- Export totals match source data
- Request GST summary → returns summary object
- Summary totals match individual transactions

**Layer 4: End-to-End Tests (User Scenarios)**

*Showroom Staff Workflow:*
1. Login to mobile app
2. Create sale entry in quick mode
3. Receive UPI payment SMS
4. Verify auto-match occurred
5. Generate invoice PDF
6. Share invoice via WhatsApp

*Accountant Workflow:*
1. Login to web app
2. View showroom transaction list
3. Filter by unmatched status
4. Manually match payment to sale
5. Export to Tally format
6. Verify export file structure

*CA Workflow:*
1. Login to web app
2. View dashboard with all clients
3. Identify client needing attention
4. Review GST summary
5. Export GST summary for filing
6. Mark filing as complete

### Test Data Strategy

**Fixtures:**
- Sample showrooms with realistic GST data
- User accounts for each role
- SMS templates for each provider
- Sale entries with various GST rate combinations

**Factories:**
- `createSaleEntry()`: generates valid sale with random data
- `createPaymentRecord()`: generates valid payment with random data
- `createUser()`: generates user with specified role
- `createShowroom()`: generates showroom with valid GSTIN

**Mocking Strategy:**
- Mock external dependencies (SMS receiver, file system, MongoDB)
- Use in-memory database for integration tests
- Mock time for testing time-based logic (60-minute unmatched queue)
- Mock PDF generation library for faster tests

### Continuous Integration

**CI Pipeline (GitHub Actions):**
1. Lint code (ESLint, Prettier)
2. Type check (TypeScript)
3. Run unit tests (Jest)
4. Run property tests (fast-check)
5. Run integration tests (Supertest)
6. Generate coverage report
7. Build mobile app (React Native)
8. Build web app (Vite)
9. Build backend (TypeScript compilation)
10. Deploy to staging (Render, Vercel)

**Quality Gates:**
- All tests must pass
- Coverage must meet targets (80% line, 75% branch)
- No TypeScript errors
- No ESLint errors
- Build must succeed

**Test Execution Time Targets:**
- Unit tests: <30 seconds
- Property tests: <2 minutes (100 runs × 52 properties)
- Integration tests: <1 minute
- Total CI pipeline: <10 minutes

### Manual Testing Checklist

**Mobile App (Android):**
- [ ] Install APK on physical device
- [ ] Grant SMS permission
- [ ] Create sale in each mode (quick, detailed, session)
- [ ] Receive real UPI payment SMS
- [ ] Verify auto-match works
- [ ] Test offline mode (airplane mode)
- [ ] Verify sync after reconnection
- [ ] Generate and share invoice
- [ ] Test on different screen sizes

**Web App (Browser):**
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Login as each role (staff, accountant, CA, admin)
- [ ] Verify role-based access restrictions
- [ ] Filter and sort transactions
- [ ] Manually match payment to sale
- [ ] Export to Tally format
- [ ] Generate GST summary
- [ ] Test with 10,000+ transactions

**Backend (API):**
- [ ] Test rate limiting
- [ ] Test concurrent user load (50 users)
- [ ] Test database connection pool exhaustion
- [ ] Test SMS parsing with real SMS from each provider
- [ ] Test matching engine with various scenarios
- [ ] Test export generation with large datasets
- [ ] Monitor error logs and alerts

### Performance Testing

**Load Testing Scenarios:**
- 50 concurrent users creating sales
- 100 concurrent API requests
- 10,000 transactions in single showroom
- Export generation for 1 year of data
- Matching engine processing 100 payments

**Performance Benchmarks:**
- API response time: p95 < 500ms
- Database query time: p95 < 100ms
- Mobile app UI response: < 200ms
- Export generation: < 30 seconds for 10,000 transactions
- Matching engine: < 5 seconds per payment

**Monitoring:**
- Application Performance Monitoring (APM) with Sentry
- Database query performance with MongoDB Atlas monitoring
- API endpoint latency tracking
- Error rate tracking
- User session tracking



## UI/UX Design Considerations

### Design Principles Applied

Based on insights from Cursor's Head of Design, Rekono's UI/UX follows these core principles:

**1. Clarity First**

Every screen must immediately answer:
- **What is this?** Clear page titles and context (e.g., "Today's Sales", "Unmatched Payments")
- **Is it for me?** Role-specific views (staff sees sales entry, CA sees client dashboard)
- **Does it work?** Visual feedback for every action (loading states, success confirmations)
- **Is it credible?** Professional styling, no obvious bugs, consistent design language

**2. Avoid Common Pitfalls**

- **No jargon**: Use "Payments waiting for sales" instead of "Unknown Queue"
- **User's language**: "Cash received" not "Payment_Record with method=cash"
- **Show old vs new world**: Dashboard shows "Manual reconciliation time saved: 4 hours/week"
- **Single CTA per section**: One primary action button, secondary actions de-emphasized
- **One message per scroll**: Each screen section has one clear purpose

**3. Details Matter**

- **No bugs above fold**: Critical paths tested thoroughly (sale entry, payment matching)
- **Consistent styling**: 8px spacing grid, consistent border radius (4px), unified shadow system
- **Visual hierarchy**: Primary actions (blue), secondary (gray), destructive (red)
- **Clean tokens**: Design system with defined colors, typography, spacing

**4. Progressive Disclosure**

- **Try before signup**: Demo mode shows sample data without account creation
- **Show value first**: Mobile app shows auto-match working before asking for SMS permission
- **No premature asks**: Don't ask for customer GSTIN until user chooses detailed mode

**5. Action-Driven Intelligence (CA OS)**

- **"What should I do next?"** not just data display
- **Actionable intelligence**: "Review 3 high-value mismatches" with direct links
- **Rules-based logic**: No AI hype, clear explanations for recommendations
- **Task prioritization**: Deadlines, risk levels, impact clearly shown
- **Workflow guidance**: Next steps suggested based on current state

### Mobile App (Store) Design

**Home Screen:**
```
┌─────────────────────────────┐
│ Rekono          [Profile]   │
├─────────────────────────────┤
│                             │
│  Today's Sales: ₹45,230     │
│  Matched: 12 | Pending: 3   │
│                             │
│  ┌─────────────────────┐   │
│  │  + New Sale         │   │ ← Primary CTA
│  └─────────────────────┘   │
│                             │
│  Recent Activity            │
│  ┌─────────────────────┐   │
│  │ ₹2,500  PhonePe     │   │
│  │ Auto-matched ✓      │   │
│  │ 2 min ago           │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ ₹1,800  Cash        │   │
│  │ Needs matching      │   │ ← Action needed
│  │ 15 min ago          │   │
│  └─────────────────────┘   │
│                             │
│  [Sales] [Payments] [More] │ ← Bottom nav
└─────────────────────────────┘
```

**Sale Entry Screen (Quick Mode):**
```
┌─────────────────────────────┐
│ ← New Sale                  │
├─────────────────────────────┤
│                             │
│  Amount *                   │
│  ┌─────────────────────┐   │
│  │ ₹ 2,500            │   │
│  └─────────────────────┘   │
│                             │
│  Payment Method *           │
│  ┌─────────────────────┐   │
│  │ [UPI] [Cash] [Card] │   │ ← Segmented control
│  └─────────────────────┘   │
│                             │
│  Need more details?         │
│  Switch to Detailed Mode    │ ← Progressive disclosure
│                             │
│  ┌─────────────────────┐   │
│  │  Save Sale          │   │ ← Primary CTA
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Payment Matching Screen:**
```
┌─────────────────────────────┐
│ ← Match Payment             │
├─────────────────────────────┤
│  Payment Received           │
│  ₹2,500 via PhonePe         │
│  2 minutes ago              │
│                             │
│  Possible Matches           │
│  ┌─────────────────────┐   │
│  │ ₹2,500              │   │
│  │ 95% match ●●●●●     │   │ ← Confidence visual
│  │ 1 minute ago        │   │
│  │ [Confirm Match]     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ ₹2,500              │   │
│  │ 70% match ●●●○○     │   │
│  │ 25 minutes ago      │   │
│  │ [Confirm Match]     │   │
│  └─────────────────────┘   │
│                             │
│  [Create New Sale]          │ ← Secondary action
└─────────────────────────────┘
```

**Offline Mode Indicator:**
```
┌─────────────────────────────┐
│ ⚠ Working Offline           │ ← Persistent banner
│ Changes will sync when      │
│ connected                   │
└─────────────────────────────┘
```

### Web App (CA OS) Design

**CA Dashboard (Home Screen):**
```
┌────────────────────────────────────────────────────────┐
│ Rekono CA OS                    [Search] [Profile]     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  What needs your attention today?                     │ ← Clear purpose
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🔴 Urgent (3)                                │    │
│  │ • ABC Traders - GSTR-1 due in 2 days        │    │ ← Action-driven
│  │ • XYZ Store - ₹15,000 mismatch              │    │
│  │ • PQR Showroom - 15 unmatched payments      │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🟡 This Week (5)                             │    │
│  │ • DEF Store - Data incomplete for 3 days    │    │
│  │ • GHI Traders - Review needed               │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  All Clients (12)                                     │
│  ┌────────────────────────────────────────────┐      │
│  │ ABC Traders          Health: 65 🟡         │      │ ← Visual health
│  │ ₹2.4L sales | 3 pending | Due: Jan 20     │      │
│  │ [Review →]                                 │      │
│  ├────────────────────────────────────────────┤      │
│  │ XYZ Store            Health: 92 🟢         │      │
│  │ ₹1.8L sales | All clear | Filed: Jan 10   │      │
│  │ [View →]                                   │      │
│  └────────────────────────────────────────────┘      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Client Detail View:**
```
┌────────────────────────────────────────────────────────┐
│ ← Back to Dashboard          ABC Traders               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Smart Summary                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │ Health Score: 65 🟡                          │    │
│  │                                              │    │
│  │ This Month: ₹2,45,000 sales | ₹44,100 GST  │    │
│  │ Status: GSTR-1 due in 2 days                │    │ ← Key info
│  │ Issues: 3 unmatched, 1 high-value mismatch  │    │
│  │                                              │    │
│  │ [File GSTR-1] [Export to Tally]            │    │ ← Primary actions
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  Timeline                                              │
│  ┌──────────────────────────────────────────────┐    │
│  │ ← Dec 2024    |    Jan 2025    |    Feb → │    │
│  │                                              │    │
│  │     ✓ Filed        ⚠ Due        ○ Upcoming  │    │ ← Visual timeline
│  │   Dec 20        Jan 20        Feb 20        │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  Transactions (245)              [Filter] [Export]    │
│  ┌────────────────────────────────────────────┐      │
│  │ Jan 15 | ₹2,500 | PhonePe | Matched ✓     │      │
│  │ Jan 15 | ₹1,800 | Cash    | Matched ✓     │      │
│  │ Jan 14 | ₹3,200 | GPay    | 70% match ⚠   │      │ ← Needs attention
│  └────────────────────────────────────────────┘      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Transaction Review Modal:**
```
┌────────────────────────────────────────┐
│ Review Match                      [×]  │
├────────────────────────────────────────┤
│                                        │
│  Payment                               │
│  ₹3,200 via Google Pay                │
│  Jan 14, 2025 at 2:45 PM              │
│  Ref: GP123456789                     │
│                                        │
│  ↓ Matched to (70% confidence)        │ ← Clear relationship
│                                        │
│  Sale                                  │
│  ₹3,200 total (₹2,712 + ₹488 GST)    │
│  Jan 14, 2025 at 2:38 PM              │
│  Invoice: INV-2025-0042               │
│                                        │
│  Why 70%?                              │ ← Explainability
│  • Amount matches exactly ✓            │
│  • 7 minute time difference ⚠          │
│                                        │
│  ┌────────────────────────────┐       │
│  │ Confirm Match              │       │ ← Primary action
│  └────────────────────────────┘       │
│  [Not a match]                        │ ← Secondary action
│                                        │
└────────────────────────────────────────┘
```

### Design System Tokens

**Colors:**
```
Primary:    #2563EB (Blue 600)
Success:    #10B981 (Green 500)
Warning:    #F59E0B (Amber 500)
Error:      #EF4444 (Red 500)
Gray-50:    #F9FAFB
Gray-100:   #F3F4F6
Gray-500:   #6B7280
Gray-900:   #111827
```

**Typography:**
```
Heading 1:  32px / 40px, Bold (Inter)
Heading 2:  24px / 32px, Semibold
Heading 3:  20px / 28px, Semibold
Body:       16px / 24px, Regular
Small:      14px / 20px, Regular
Tiny:       12px / 16px, Regular
```

**Spacing:**
```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
```

**Shadows:**
```
sm:  0 1px 2px rgba(0,0,0,0.05)
md:  0 4px 6px rgba(0,0,0,0.1)
lg:  0 10px 15px rgba(0,0,0,0.1)
```

**Border Radius:**
```
sm:  4px
md:  8px
lg:  12px
full: 9999px
```

### Accessibility Considerations

**WCAG 2.1 Level AA Compliance:**
- Color contrast ratio ≥ 4.5:1 for normal text
- Color contrast ratio ≥ 3:1 for large text (18px+)
- All interactive elements keyboard accessible
- Focus indicators visible on all focusable elements
- Form labels associated with inputs
- Error messages announced to screen readers
- Alt text for all meaningful images

**Mobile Accessibility:**
- Touch targets ≥ 44×44 pixels
- Pinch-to-zoom enabled
- Text resizable up to 200%
- Landscape and portrait orientations supported

**Screen Reader Support:**
- Semantic HTML (nav, main, article, aside)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content updates
- Skip navigation links

### Responsive Design Breakpoints

```
Mobile:     320px - 767px
Tablet:     768px - 1023px
Desktop:    1024px - 1439px
Wide:       1440px+
```

**Mobile-First Approach:**
- Design for mobile first, enhance for larger screens
- Single column layout on mobile
- Two column layout on tablet
- Three column layout on desktop
- Progressive enhancement for features

### Loading States and Feedback

**Skeleton Screens:**
- Show content structure while loading
- Avoid spinners for initial page load
- Use for transaction lists, dashboards

**Progress Indicators:**
- Determinate progress bar for exports (0-100%)
- Indeterminate spinner for API calls
- Toast notifications for background operations

**Success Feedback:**
- Green checkmark for completed actions
- Toast notification: "Sale saved successfully"
- Optimistic UI updates (show immediately, sync in background)

**Error Feedback:**
- Red error icon for failed actions
- Specific error message with recovery action
- Inline validation errors on form fields

### Empty States

**No Data Yet:**
```
┌────────────────────────────┐
│                            │
│     [Illustration]         │
│                            │
│  No sales yet today        │
│  Create your first sale    │
│  to get started            │
│                            │
│  [+ New Sale]              │
│                            │
└────────────────────────────┘
```

**No Results:**
```
┌────────────────────────────┐
│                            │
│  No transactions found     │
│  for this date range       │
│                            │
│  Try adjusting your        │
│  filters or date range     │
│                            │
│  [Clear Filters]           │
│                            │
└────────────────────────────┘
```

### Onboarding Flow

**First-Time Mobile User:**
1. Welcome screen: "Record sales, match payments automatically"
2. SMS permission request: "We'll capture UPI payments from SMS"
3. Quick tutorial: "Create your first sale in 3 taps"
4. Success celebration: "Great! Now wait for a payment SMS"

**First-Time CA User:**
1. Welcome screen: "Your command center for all clients"
2. Dashboard tour: "See what needs attention today"
3. Client detail tour: "Review transactions and export data"
4. Success: "You're all set! We'll alert you when action is needed"

### Performance Optimization

**Perceived Performance:**
- Optimistic UI updates (show success immediately)
- Skeleton screens instead of blank pages
- Lazy load images and heavy components
- Prefetch likely next pages

**Actual Performance:**
- Code splitting by route
- Image optimization (WebP, lazy loading)
- API response caching (React Query)
- Database query optimization (indexes)



## Deployment and Operations

### Environment Configuration

**Development Environment:**
- Local MongoDB instance or MongoDB Atlas free tier
- Node.js backend running on localhost:3000
- React web app running on localhost:5173 (Vite dev server)
- React Native mobile app running on Android emulator or physical device
- Environment variables in `.env.development`

**Staging Environment:**
- MongoDB Atlas free tier (separate database from production)
- Backend deployed to Render free tier
- Web app deployed to Vercel preview deployment
- Mobile app distributed via internal APK
- Environment variables in Render/Vercel dashboard

**Production Environment:**
- MongoDB Atlas free tier (512MB storage, shared cluster)
- Backend deployed to Render free tier (512MB RAM, sleeps after 15 min inactivity)
- Web app deployed to Vercel free tier (100GB bandwidth/month)
- Mobile app distributed via APK (Play Store in future)
- Environment variables in Render/Vercel dashboard

### Environment Variables

**Backend (.env):**
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rekono
JWT_SECRET=<random-256-bit-secret>
JWT_EXPIRY=7d
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
LOG_LEVEL=info
SENTRY_DSN=<sentry-project-dsn>
```

**Web App (.env):**
```
VITE_API_BASE_URL=https://api.rekono.app/v1
VITE_ENVIRONMENT=production
VITE_SENTRY_DSN=<sentry-project-dsn>
```

**Mobile App (app.config.js):**
```javascript
export default {
  expo: {
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || 'https://api.rekono.app/v1',
      environment: process.env.ENVIRONMENT || 'production',
      sentryDsn: process.env.SENTRY_DSN,
    },
  },
};
```

### Deployment Process

**Backend Deployment (Render):**
1. Push code to GitHub main branch
2. Render auto-deploys from GitHub
3. Runs `npm install` and `npm run build`
4. Starts server with `npm start`
5. Health check endpoint: `GET /health`
6. Deployment takes ~2-3 minutes

**Web App Deployment (Vercel):**
1. Push code to GitHub main branch
2. Vercel auto-deploys from GitHub
3. Runs `npm install` and `npm run build`
4. Deploys static files to CDN
5. Deployment takes ~1-2 minutes
6. Preview deployments for pull requests

**Mobile App Deployment:**
1. Update version in `app.json`
2. Run `eas build --platform android --profile production`
3. Download APK from Expo servers
4. Distribute APK via internal channels
5. Future: Submit to Google Play Store

### Database Migrations

**Migration Strategy:**
- No formal migration framework for MVP
- Schema changes handled via application code
- Backward-compatible changes only
- New fields added with default values
- Old fields deprecated but not removed

**Example Migration (Add field to SaleEntry):**
```javascript
// In application code
const sale = await SaleEntry.findById(id);
if (!sale.invoiceNumber) {
  // Handle missing field gracefully
  sale.invoiceNumber = await generateInvoiceNumber(sale.showroomId);
  await sale.save();
}
```

**Future Migration Tool:**
- Use migrate-mongo for formal migrations
- Version-controlled migration scripts
- Rollback capability
- Applied automatically on deployment

### Monitoring and Alerting

**Application Monitoring (Sentry):**
- Error tracking and reporting
- Performance monitoring (API latency, database queries)
- User session replay for debugging
- Alert on error rate spike (>10 errors/minute)

**Infrastructure Monitoring (Render Dashboard):**
- CPU and memory usage
- Request rate and response time
- Deployment status and logs
- Alert on service downtime

**Database Monitoring (MongoDB Atlas):**
- Connection pool usage
- Query performance (slow queries >100ms)
- Storage usage (alert at 80% capacity)
- Backup status

**Custom Metrics (Application):**
- Daily active users (DAU)
- Auto-match rate (target: ≥60%)
- Average match confidence
- API error rate
- Export generation success rate

**Alert Channels:**
- Email to admin users
- Slack webhook for critical alerts
- SMS for production outages (future)

### Backup and Recovery

**Database Backups:**
- MongoDB Atlas automatic daily backups
- Retention: 7 days on free tier
- Point-in-time recovery not available on free tier
- Manual backup before major changes: `mongodump`

**File Backups (Invoice PDFs):**
- Stored on Render persistent disk (1GB free)
- No automatic backup on free tier
- Manual backup to S3 weekly (future)
- Recovery: re-generate invoices from database

**Disaster Recovery Plan:**
1. Detect outage (monitoring alerts)
2. Check Render/Vercel status pages
3. If database issue: restore from latest backup
4. If backend issue: rollback to previous deployment
5. If data corruption: restore from backup, replay transactions
6. Communicate status to users via status page

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours (daily backups)

### Security Considerations

**Authentication Security:**
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens signed with 256-bit secret
- Tokens expire after 7 days
- Account lockout after 3 failed attempts (15 min)
- HTTPS only (enforced by Render/Vercel)

**Data Security:**
- MongoDB connection encrypted (TLS)
- API requests over HTTPS only
- Sensitive data (GSTIN, mobile) not logged
- User passwords never logged or exposed
- Role-based access control enforced

**Mobile App Security:**
- API tokens stored in secure storage (Keychain/Keystore)
- SMS data processed locally, not sent to server
- Local database encrypted (SQLCipher future)
- Certificate pinning for API calls (future)

**Web App Security:**
- Content Security Policy (CSP) headers
- XSS protection via React's built-in escaping
- CSRF protection via JWT tokens
- No sensitive data in localStorage
- Secure cookie flags (HttpOnly, Secure, SameSite)

**API Security:**
- Rate limiting (100 req/min per user)
- Input validation on all endpoints
- SQL injection prevention (MongoDB parameterized queries)
- NoSQL injection prevention (sanitize inputs)
- CORS restricted to known origins

### Scaling Considerations

**Current Limits (Free Tier):**
- MongoDB: 512MB storage (~50,000 transactions)
- Render: 512MB RAM, sleeps after 15 min inactivity
- Vercel: 100GB bandwidth/month
- Concurrent users: ~50 (limited by Render RAM)

**Scaling Triggers:**
- Storage >400MB: upgrade MongoDB to M2 ($9/month)
- RAM usage >400MB: upgrade Render to Starter ($7/month)
- Bandwidth >80GB: upgrade Vercel to Pro ($20/month)
- Concurrent users >40: upgrade Render to Standard ($25/month)

**Horizontal Scaling (Future):**
- Multiple Render instances behind load balancer
- MongoDB replica set for read scaling
- Redis for session storage and caching
- CDN for static assets and invoice PDFs

**Database Scaling (Future):**
- Shard by showroomId for write scaling
- Read replicas for analytics queries
- Archive old transactions (>2 years) to cold storage
- Separate database for CA OS analytics

### Cost Projections

**MVP (0-10 showrooms):**
- MongoDB Atlas: Free
- Render: Free
- Vercel: Free
- Total: ₹0/month

**Early Growth (10-50 showrooms):**
- MongoDB Atlas M2: $9/month
- Render Starter: $7/month
- Vercel: Free
- Total: ~₹1,300/month

**Scale (50-200 showrooms):**
- MongoDB Atlas M10: $57/month
- Render Standard: $25/month
- Vercel Pro: $20/month
- Total: ~₹8,500/month

**Revenue Model:**
- Showroom: ₹500/month per showroom
- CA: ₹200/month per client showroom
- Accountant marketplace: 20% commission on jobs
- Break-even: 20 showrooms or 50 CA clients

### Operational Runbooks

**Runbook: Backend Service Down**
1. Check Render dashboard for service status
2. Check recent deployments (rollback if needed)
3. Check error logs in Sentry
4. Check MongoDB Atlas status
5. Restart service via Render dashboard
6. If issue persists, rollback to previous deployment
7. Notify users via status page

**Runbook: High Error Rate**
1. Check Sentry for error details
2. Identify affected endpoint or component
3. Check if recent deployment caused issue
4. If yes, rollback deployment
5. If no, investigate root cause in logs
6. Apply hotfix if critical
7. Monitor error rate after fix

**Runbook: Database Connection Issues**
1. Check MongoDB Atlas status
2. Check connection pool usage
3. Check for long-running queries
4. Kill long-running queries if needed
5. Restart backend service
6. If issue persists, contact MongoDB support
7. Consider scaling database tier

**Runbook: SMS Parsing Failures**
1. Check error logs for failed SMS
2. Identify payment provider
3. Check if SMS format changed
4. Update parser regex pattern
5. Deploy hotfix
6. Manually process failed SMS from review queue
7. Monitor parsing success rate

### Maintenance Windows

**Scheduled Maintenance:**
- Database backups: Daily at 2:00 AM IST (no downtime)
- Dependency updates: Monthly, Sunday 2:00-4:00 AM IST
- Major version upgrades: Quarterly, announced 1 week in advance

**Zero-Downtime Deployments:**
- Backend: Render performs rolling restart
- Web app: Vercel atomic deployments (instant switch)
- Mobile app: Users update at their convenience

**Emergency Maintenance:**
- Security patches: Applied immediately
- Critical bug fixes: Applied within 4 hours
- Data corruption fixes: Applied within 24 hours

