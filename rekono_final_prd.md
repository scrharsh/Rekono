# Rekono — Product Requirement Document (Final)

## Product Summary

Rekono is a **Business Reconciliation & Activity OS** for Indian businesses and an **Intelligent Workspace OS** for CAs. It is **not** billing software, **not** an accounting clone, and **not** a Tally replacement on day one. Its job is to turn messy real-world business activity into **trusted, structured, linked records** with the least possible human effort.

Rekono has two independent systems:

1. **Business OS** for stores, agencies, service businesses, wholesalers, workshops, and mixed businesses.
2. **CA OS** for Chartered Accountants to manage clients, services, payments, documents, tasks, and knowledge.

The two systems are connected **only when the business chooses to connect with a CA**.

Both systems are available across mobile/web, and both require desktop applications for full operational workflows.

---

## 1. Product Vision

Rekono helps businesses and CAs reduce manual reconciliation, confusion, duplicate records, and compliance friction by creating a single source of truth for each business event and then reusing it for invoices, payments, reports, GST-ready exports, and CA work.

The product must feel:

- fast,
- intelligent,
- low-effort,
- adaptable to different businesses,
- and trustworthy.

---

## 2. Core Product Thesis

The biggest bottleneck is not payment capture.
The biggest bottleneck is:

> **How do we capture the sale/business context once, without making the business do extra work every time?**

Rekono solves this by:

- creating context once,
- matching payments later,
- resolving only exceptions,
- and providing structured outputs to business owners and CAs.

---

## 3. Product Category

Rekono is a:

- **Business Reconciliation OS**
- **Transaction Intelligence Platform**
- **CA Workflow and Intelligence Workspace**

It is deliberately **not** positioned as:

- billing software,
- accounting software,
- GST filing software,
- or a Tally clone.

---

## 4. Target Users

### 4.1 Business Side

Primary users:

- GST-registered businesses,
- retail stores,
- service businesses,
- agencies,
- wholesalers,
- workshops,
- mixed businesses.

Characteristics:

- busy,
- low patience for long workflows,
- not tech-savvy in most cases,
- need fast capture and minimal friction,
- may use UPI, direct bank transfers, cash, or mixed payment methods.

### 4.2 CA Side

Primary users:

- Chartered Accountants,
- CA firms,
- CA teams.

Characteristics:

- need client management,
- payments,
- documents,
- deadlines,
- status tracking,
- knowledge answers,
- a clear operating system for work.

### 4.3 Accountant Layer

Secondary users:

- freelance bookkeepers,
- cleanup/accounting support workers.

They handle unresolved entries, cleanup, categorization support, and data preparation.

---

## 5. Core Product Rules

1. **System manages itself.** Humans only handle exceptions.
2. **No staff-heavy workflow.** Staff should not be the core operator.
3. **No upfront heavy catalog upload.** Catalog should grow progressively.
4. **No reliance on reading every payment manually.**
5. **No assumption that all businesses work the same way.**
6. **One source record per business event.**
7. **Flexible behavior, strict traceability.**
8. **Optional CA connection.** Business and CA are separate entities.

---

## 6. Key Product Principles

### 6.1 Zero-Management by Default

The product must not require daily discipline from staff or owners.

### 6.2 Exception-Only Human Work

Humans should act only when the system cannot resolve something confidently.

### 6.3 Progressive Detail

Capture broad information first, then refine only when necessary.

### 6.4 Adaptive to Business Type

Different businesses have different billing and service behavior.

### 6.5 Single Source of Truth

A business event should be created once and reused across outputs.

---

## 7. Product Structure

Rekono has three major layers.

### 7.1 Business OS

Used by business owners to manage business activity, reconciliation, customer records, and business outputs.

### 7.2 CA OS

Used by CAs to manage clients, services, pending work, payments, documents, deadlines, and knowledge.

### 7.3 Optional Bridge

A business can connect its reports or exports to a CA if the CA exists on Rekono and accepts the connection.

### 7.4 Platform Surfaces (Mobile, Web, Desktop)

Rekono will run on three surfaces with different roles:

- **Mobile app:** fast confirmations, quick capture, field operations.
- **Web app:** accessible browser workflow for business and CA.
- **Desktop app:** high-productivity workspace for bulk operations, deep review, document-heavy tasks, exports, and reporting.

Desktop is required for both **Business OS** and **CA OS**.

---

## 8. Business OS — Product Design

### 8.1 Core Goal

Capture business activity with minimal friction, then convert it into clean, linked records.

### 8.2 Universal Event Model

Every business ultimately deals with a few event types:

- Sale / service done
- Payment received
- Payment pending
- Expense paid (later phase)

This is the universal base for all business types.

### 8.3 Context Model

Different businesses require different context. Rekono must support dynamic context fields such as:

- category,
- type,
- brand,
- model,
- series,
- GST rate,
- quantity,
- notes,
- service duration,
- customer info,
- order reference,
- payment reference.

These must be optional and progressive.

### 8.4 Business Modes

During setup, the business chooses a behavior mode such as:

- retail,
- wholesale,
- services,
- agency,
- workshop/repair,
- mixed.

The mode changes default fields, templates, and flow behavior.

### 8.5 Responsibility Model

The system must not depend on staff for core operation. Staff are busy with customers, not tech-savvy, and cannot be relied on for data entry.

| Layer | Who | Responsibility |
|-------|-----|----------------|
| **System** | Automatic | 80–90% of work: capture, match, classify, reconcile |
| **Owner** | 1-tap interaction | Confirm suggestions, resolve simple exceptions |
| **Accountant** | Backend cleanup | Fix unresolved data, prepare structured records |
| **CA** | Compliance & oversight | Use final clean output for client work |
| **Staff** | Near zero | Not part of the core system |

---

## 9. Best UX for Business Side

### 9.1 UX Goal

The business side should feel like:

- no extra work,
- no long forms,
- no staff dependency,
- no catalog burden,
- no daily management stress.

### 9.2 Main UX Pattern

The system should show the owner only what matters:

- what happened,
- what is unclear,
- what needs confirmation,
- what is pending.

Example home screen:

```
Today:
₹25,000 received
₹22,000 auto-processed
₹3,000 needs review

[Resolve in 10 sec]
```

### 9.3 Progressive Catalog Creation

No one uploads the full catalog manually on day one.
The catalog should grow through use:

- confirm a recurring item,
- save it,
- system remembers,
- suggestions improve over time.

**Progressive growth timeline:**

| Timeline | Catalog State |
|----------|--------------|
| **Day 1** | No catalog. System guesses from payment patterns. Owner taps to confirm. |
| **Day 3** | Top items created from confirmed guesses. Faster suggestions. |
| **Day 7** | Patterns established. Most transactions auto-classified. |
| **Day 30** | Strong catalog built. Minimal owner interaction needed. |

**Onboarding approach:**

1. Select business type → system pre-loads default categories.
2. Ask for top 5 items only.
3. Everything else handled as "Other" initially.
4. Catalog grows automatically from usage.

### 9.4 Fast Capture Patterns

The system must support:

- recent items,
- favorites,
- repeat last bill,
- templates,
- quick-add,
- barcode/SKU where relevant,
- service packages,
- one-tap confirmation.

### 9.5 Complex Item Support

For products with model/series/brand differences:

- first capture category/type,
- then optional brand/model/series when relevant,
- never force all details always,
- ask for deeper detail only when needed.

**Detail levels by transaction value:**

| Case | Detail Required |
|------|----------------|
| ₹500 saree | Category only |
| ₹2,500 kurti | Category + type |
| ₹50,000 TV | Category + brand + model |
| Service call | Service type only |

### 9.6 Exception-Only Workflow

The business side should default to automatic processing.
Only unclear items should go to a review queue.

### 9.7 Interaction Effort Model

- **80% of cases:** 1 tap → Done.
- **15% of cases:** 2–3 taps → Done.
- **5% of cases:** Manual fix later (by owner or accountant).

---

## 10. Reconciliation Engine

### 10.1 Purpose

The reconciliation engine links payments to business events.

### 10.2 Supported Inputs

- UPI payments,
- direct bank transfers,
- cash entries,
- later imports / statements if needed.

### 10.3 Matching Signals

The matching engine may use:

- amount,
- time,
- sender/name,
- narration/reference,
- expected payment,
- customer history,
- pending invoices,
- business mode,
- repeated patterns.

### 10.4 Output States

A payment can be:

- auto-matched,
- probable match,
- unmatched,
- needs review.

### 10.5 Exception Queue

Only unresolved items should reach humans.
Humans should never be expected to inspect every payment.

### 10.6 Smart Learning

The system should learn and improve matching over time:

- **Default mapping:** ₹2,500 → always Saree at this shop? Auto-confirm next time.
- **Customer patterns:** Rahul → usually buys shoes.
- **Time patterns:** Morning → wholesale orders, Evening → retail.
- **Business mode defaults:** Saree Shop → most incoming payments = saree.
- **Auto-catalog expansion:** ₹799 recurring → system suggests creating a new item.

---

## 11. Fraud and Integrity Control

### 11.1 Problem

Some businesses may maintain different bill versions for customer and GST usage. This fraud is done by owners themselves — not staff.

### 11.2 Product Position

Rekono should not behave like a strict policing tool that blocks adoption. If the system forces honesty too hard, users will leave. If the system allows total chaos, the product becomes useless.

### 11.3 Integrity Solution

Rekono should provide:

- one source invoice record,
- change history,
- edit logs,
- cancellation / credit note handling,
- GST mismatch alerts,
- audit trail,
- role-based permissions.

### 11.4 Principle

**Flexible creation, strict traceability.**

Allow business flexibility, but make changes visible and traceable.

### 11.5 Anti-Fraud Controls

1. **Immutable invoice identity:** Every bill gets a unique invoice number, timestamp, business ID, and item list hash. If edited later, the change is logged.
2. **Edit trail:** Any change to amount, tax, item, discount, or cancellation must be recorded.
3. **Credit note / cancellation flow:** Wrong bills must be cancelled or adjusted by credit note — never silently replaced.
4. **Customer-visible invoice:** Same invoice shared via print, WhatsApp, PDF, or QR verification link. Makes dual billing harder.
5. **GST mismatch alerts:** System flags sales totals that don't match payments, repeated low-value customer bills with high-value GST entries, unusual discount patterns, missing invoice sequences, suspicious cancellation rates.
6. **Role-based access:** Staff creates, owner approves changes, accountant reviews, CA audits.

---

## 12. Billing and Invoice Philosophy

Rekono is not billing software first.
However, invoices are an output of a trusted business record.

The system should:

- generate a single invoice source,
- create customer copy,
- create accounting/GST copy,
- store audit version,
- allow WhatsApp/PDF/print output when needed.

From the same record, never separate manual versions.

---

## 13. Catalog and Product Handling

### 13.1 Catalog Must Not Be a Setup Barrier

Do not force full inventory upload.

### 13.2 Catalog Should Be Progressive

Use default templates, top items, recent items, and auto-learning.

### 13.3 Support for Variations

Support:

- model,
- series,
- brand,
- type,
- GST class,
- custom attributes.

### 13.4 Adaptive Detail Level

Different transactions should require different detail depths.

- small retail item: category only,
- electronics: category + model optional,
- service: service type + price,
- mixed: dynamic line items.

### 13.5 Item Data Structure

Items use flexible, optional attributes instead of rigid fixed schemas:

```
Item:
  - Category (required)
  - Type (optional)
  - Brand (optional)
  - Model (optional)
  - Series (optional)
  - GST Rate (optional, system-suggested)
  - Base Price (optional)
  - Selling Price (optional)
  - Notes (optional)
```

This same structure works for all business types — retail, electronics, services, agencies — just with different depth.

---

## 14. CA OS — Product Design

### 14.1 Core Goal

The CA side is a **fully intelligent workspace**, not just a client-data viewer. It must think, prioritize, and guide actions automatically.

A CA should open Rekono and immediately know:

- What is wrong
- What is urgent
- What needs to be done
- What can be ignored

### 14.2 CA OS Must Help With

- client registration and management,
- client services,
- client payments,
- pending payments,
- document storage,
- tasks,
- compliance tracking,
- deadlines,
- guidance,
- knowledge lookup,
- collection follow-ups.

### 14.3 CA OS Home Screen — Command Center

This is a **decision screen**, not a dashboard.

```
Today:
⚠️ 5 urgent issues
⚠️ 2 deadlines approaching

Focus Now:
→ Sharma Traders (High Risk)
→ Gupta Electronics (₹1.2L mismatch)

System Suggests:
→ Fix Sharma first (deadline in 24h)

Top Priority:
1. File GSTR-1 (Sharma)
2. Fix ₹1.2L mismatch (Gupta)
3. Review missing entries (Verma)
```

The CA should not need to think about what to do next. The system should guide.

### 14.4 CA Intelligence Architecture

The CA OS is powered by four engines:

#### 14.4.1 Detection Engine (Find problems automatically)

Automatically finds:

- **Data issues:** Unmatched payments, missing entries, incomplete data.
- **Compliance risks:** GST mismatch, unreported transactions, approaching deadlines.
- **Behavioral patterns:** Client delays data, sudden spikes, unusual activity.

#### 14.4.2 Prioritization Engine (Decide what matters)

Not all problems are equal. System ranks by urgency:

- **HIGH:** GST deadline in 2 days, large mismatch, legal risk.
- **MEDIUM:** Missing entries, incomplete documents.
- **LOW:** Minor inconsistencies, style issues.

#### 14.4.3 Action Engine (Tell what to do)

Instead of just showing data, the system provides specific recommended actions with 1-click execution:

```
Recommended Actions:
→ Fix unmatched entries    [Fix Now]
→ Request missing data     [Notify Client]
→ Mark ready for filing    [Mark Ready]
```

#### 14.4.4 Learning Engine (Adaptive behavior)

No heavy AI initially — just smart memory:

- Client patterns (usual behavior, delays, common issues),
- Repeated issues and resolutions,
- Category trends,
- Seasonal patterns.

### 14.5 Client Health Score

Every client gets a health score based on:

- Data completeness,
- Accuracy,
- Timeliness.

```
Sharma Traders → 62% ⚠️
Gupta Electronics → 94% ✅
```

Gives instant clarity without deep-diving into each client.

### 14.6 CA Client Workspace

For every client, the CA should see a complete workspace:

```
Client: Sharma Traders
Health Score: 62% ⚠️

GSTIN: XXXXX
Type: Retail
Status: Active

Services: 3 active
Pending Tasks: 5
Pending Payment: ₹3,000

Issues:
- 12 unmatched entries
- Missing data (2 days)

Impact:
⚠️ GST filing risk

Actions:
[Fix Data] [Request Info] [Mark Ready]
```

### 14.7 Client Registration & Management

- **Quick add:** Name + phone only.
- **Smart add:** Import via GSTIN (future).
- **Client types:** Proprietor, Pvt Ltd, Partnership, etc.
- **Client profile** becomes a mini-dashboard per client showing services, tasks, payments, documents, health score.

### 14.8 Service Management

Track what the CA is doing for each client:

- **Assign services:** GST Filing (Monthly), Registration, Consultation, Compliance.
- **Track status per period:** Pending → In Progress → Completed.
- **Monitor fees per service.**
- **Replaces messy Excel tracking** with structured service records.

```
Sharma Traders:
  GST Filing:
    April → Pending
    May → In Progress
    June → Completed
  Fees: ₹2,000/month
```

### 14.9 Payment & Collection Tracking

Full visibility of CA earnings:

- **Per-client:** Total fees, received, pending.
- **Global view:** All pending payments ranked by priority.
- **Overdue alerts** with smart reminders.
- **Actions:** Send reminder, mark paid, follow-up tracking.

```
Pending Payments:
  Gupta → ₹5,000 (overdue 15 days) [HIGH]
  Sharma → ₹3,000 (due in 3 days) [MEDIUM]
  Verma → ₹1,500 (on time) [LOW]
```

### 14.10 Document Storage

Central document hub per client:

- **Document types:** PAN, GST Certificate, Aadhaar, Bank details, Agreements, Proofs.
- **Upload:** Drag & drop, mobile upload.
- **Completeness tracking:** ✔ PAN, ✔ GST, ⚠️ Bank Proof missing.
- **Smart alerts** for missing documents that block workflows.
- **Removes WhatsApp chaos** — one central place for all client documents.

### 14.11 Knowledge Engine

When a CA or their client asks about processes, schemes, or regulations, the system provides **structured, actionable answers** — not generic search results.

**Example query: "How to register GST?"**

```
Steps:
1. Check eligibility
2. Collect documents (PAN, Aadhaar, Bank details, Address proof)
3. Apply on GST portal
4. OTP verification
5. ARN generated → Certificate issued

Time: 3–7 days
Cost: ₹500–₹2,000 (market average)

Checklist:
[ ] PAN
[ ] Aadhaar
[ ] Bank details
[ ] Address proof
```

**Knowledge engine covers:**

- Government schemes and eligibility (MSME Registration, Mudra Loan, Startup benefits),
- Registration processes (GST, Company, Partnership),
- Service management and suggested charges,
- Compliance paths and checklists,
- Payment structures and collection best practices.

**Charges & Pricing Intelligence:**

```
Suggested charges:
  GST Filing: ₹1,500–₹3,000/month
  Based on: client size, transaction volume

Helps new CAs especially.
```

**Contextual suggestions for clients:**

```
Client: Sharma Traders (New business)

Recommended:
→ GST Registration
→ Current account setup
→ Basic compliance checklist
```

**MVP scope:** Top 5 use cases only — GST registration, GST filing, basic compliance, invoice rules, payment tracking. Expand later.

**Critical rule:** Do NOT dump generic content or copy articles. Every answer must be structured with steps, time, cost, documents required, and actions.

### 14.12 Integrated Intelligence

The CA OS combines data + knowledge for real intelligence:

```
Client missing GST registration
→ System suggests: "Register GST now to avoid penalty"
→ Provides steps and checklist
→ Creates task automatically
→ Sets deadline alert
```

This is what turns Rekono from a tool into an **indispensable operating system**.

### 14.13 CA is Separate from Business

Businesses are not automatically linked to CAs.
Connection is optional and permission-based.

---

## 15. Store ↔ CA Bridge

### 15.1 Connection Model

A business can search for or connect to a CA.
The CA must accept the connection.
Only then can the business send selected reports or documents.

### 15.2 Permission Model

The store controls what is shared.
The CA sees only what is shared.

### 15.3 Purpose

The bridge is for:

- report sharing,
- document handoff,
- summary exports,
- workflow collaboration.

It is not a forced dependency.

---

## 16. Payment and Bank Handling

### 16.1 Direct Bank Payments

The system must support direct bank payments through reconciliation.

### 16.2 No Manual Every-Time Work

Businesses should not need to manually inspect every bank payment.

### 16.3 Matching Fallbacks

If the system cannot confidently match a payment, it should go to the unresolved queue.

### 16.4 Mobile-First

The product must work on a phone because many small and mid-sized businesses do not have laptops.

---

## 17. UX Design Goals

### Business Side UX

- mobile-first,
- low typing,
- no heavy setup,
- no catalog burden,
- automatic learning,
- exception-only work,
- one-tap confirmations,
- clear unresolved state.

### CA Side UX

- web-first,
- desktop-primary for deep work,
- dense but organized,
- intelligent summaries,
- tasks and recommendations,
- client workspace, not just a table,
- knowledge answers in structured form.

### Desktop UX (Business + CA)

- multi-panel workflows for quick switching,
- bulk actions and table-heavy operations,
- faster data review and reconciliation resolution,
- better export/print/document workflows,
- keyboard-first productivity for power users.

### Universal UX Rule

The system should explain, guide, and reduce thinking.
It should not overwhelm with forms.

> If your system reduces thinking effort, users will love it.
> If it adds thinking effort, they will ignore it.

---

## 18. MVP Scope

### 18.1 Business OS MVP

Build:

- business profile setup,
- business mode selection,
- progressive catalog,
- quick business event capture,
- payment matching,
- unresolved queue,
- invoice output,
- audit logs,
- basic reports,
- optional CA sharing,
- desktop app foundation for owner workflows (auth, dashboard, exception queue, reports, exports).

### 18.2 CA OS MVP

Build:

- CA profile,
- client management (registration + workspace),
- services tracking (assign, status, fees),
- payments tracking (received, pending, overdue),
- document storage (upload, completeness tracking, alerts),
- tasks and workflow,
- intelligent summaries (command center),
- knowledge answers for top 5 CA use cases,
- desktop app foundation for CA workflows (auth, command center, client workspace, documents, exports).

### 18.3 Must Not Build Yet

Do not build yet:

- full accounting replacement,
- heavy AI prediction,
- GST filing automation,
- inventory ERP,
- staff-heavy workflows,
- overly rigid controls,
- complex setup flows,
- generic knowledge base (start with top 5 only).

---

## 19. Success Metrics

### Business Side Metrics

- auto-resolution rate (target: >70%),
- percentage of unresolved items,
- time per action (target: <3 seconds),
- daily active usage,
- retention,
- number of repeated item suggestions accepted.

### CA Side Metrics

- client count per CA,
- tasks resolved per day,
- document completion rate,
- pending payment resolution rate,
- response time to client requests,
- usage of knowledge engine.

### Platform Metrics

- store-to-CA connection rate,
- export usage,
- retention after 30 days,
- referral growth,
- repeat weekly use.

---

## 20. UX North Star

> **The system should do the thinking; the user should only approve what truly needs attention.**

That is the main UX goal for both business and CA sides.

---

## 21. Product Positioning Statement

Rekono is an adaptive business reconciliation and intelligence platform that turns messy real-world business activity into structured records, trusted invoices, payment links, and intelligent CA workflows—without forcing users into rigid, manual accounting behavior.

---

## 22. Final Product Definition

### Rekono Business OS

For businesses that need:

- transaction capture,
- reconciliation,
- invoice output,
- payment matching,
- auditability,
- flexible business modes,
- minimal manual work.

### Rekono CA OS

For CAs who need:

- client management,
- service tracking,
- payments and collections,
- documents,
- pending work,
- deadlines,
- knowledge guidance,
- a real intelligent workspace.

### Rekono Bridge

An optional permission-based connector between business and CA.

---

## 23. Implementation Priorities

### Phase 1

- Business event capture,
- progressive catalog,
- payment reconciliation,
- unresolved queue,
- invoice output,
- CA client workspace basics (registration, services, payments, documents),
- desktop app shells for Business and CA with shared core workflows.

### Phase 2

- pattern learning,
- better suggestions,
- smart summaries,
- document workflows,
- richer CA intelligence (detection + prioritization engines),
- improved exports,
- knowledge engine (top 5 use cases),
- desktop productivity enhancements (bulk actions, keyboard shortcuts, multi-window operations).

### Phase 3

- deeper knowledge engine,
- workflow automation,
- advanced collaboration,
- broader business behavior support,
- learning engine (adaptive predictions),
- charges and pricing intelligence.

---

## 24. Final Principle

Rekono should never become a generic billing tool.
It should remain a system that:

- captures business truth once,
- keeps it traceable,
- reduces human work,
- adapts to different businesses,
- and gives CAs a truly intelligent workspace.

It should also support both mobile-first and desktop-first working styles without forcing one platform behavior on all users.

**Final truth:**

- If you only manage work → you are a tool.
- If you guide decisions → you become indispensable.
