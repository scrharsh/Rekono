# Rekono — Full Build Implementation Plan (Updated)

## Design System: "The Obsidian Architect"

Stitch has generated a complete enterprise design system and 6 key screens for Rekono.

**Stitch Project:** `projects/10857587264795582941`
**Design System:** `assets/c92d96e7449e431d9265fa360d65af74` — "Rekono Intelligence"

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `surface` | `#0b1326` | Base background |
| `surface_container_low` | `#131b2e` | In-page sections |
| `surface_container` | `#171f33` | Interactive cards |
| `surface_container_high` | `#222a3d` | Elevated elements |
| `surface_container_highest` | `#2d3449` | Modals, popovers |
| `primary_container` | `#4f46e5` | Indigo-600, CTAs |
| `primary` | `#c3c0ff` | Indigo light, text accents |
| `secondary_container` | `#3131c0` | Secondary actions |
| `tertiary` | `#bdc2ff` | Intelligence highlights |
| `on_surface` | `#dae2fd` | Primary text |
| `on_surface_variant` | `#c7c4d8` | Secondary text |
| `outline_variant` | `#464555` | Ghost borders (15% opacity) |
| `error` | `#ffb4ab` | Error states |

### Design Principles

1. **No-Line Rule:** No 1px borders for sectioning — use tonal background shifts
2. **Tonal Architecture:** Depth through layered surfaces, not shadows
3. **Ghost Borders:** `outline_variant` at 15% opacity only when accessibility requires
4. **Signature Gradient:** `linear-gradient(135deg, #4f46e5 0%, #c3c0ff 100%)`
5. **Typography:** Inter for all text — display/headline/title/body/label hierarchy
6. **Tabular Numbers:** `font-feature-settings: "tnum" 1` for financial data

### Screens Designed in Stitch

| Screen | Type | ID |
|--------|------|-----|
| Login Page | Desktop | `e2cb6b6448714ebea54a2c2c90d7af8b` |
| Registration Page | Desktop | Generated |
| CA Command Center | Desktop | Generated |
| Client Workspace | Desktop | Generated |
| Mobile Business Home | Mobile | Generated |
| Knowledge Engine | Desktop | Generated |
| Landing Page | Desktop | Generated |

---

## Current Codebase Audit

### What Already Exists (✅ Keep & Evolve)

| Layer | Module | Status |
|-------|--------|--------|
| **Backend** | Auth (JWT + Passport) | ✅ Working — roles: staff, accountant, ca, admin |
| **Backend** | Sales CRUD | ✅ Working |
| **Backend** | Payments CRUD | ✅ Working |
| **Backend** | Matching Engine | ✅ Working — amount + time matching, auto-match, split payments |
| **Backend** | CA OS Service | ⚠️ Partial — health score, tasks, alerts, summaries |
| **Backend** | Connections (Bridge) | ✅ Working |
| **Backend** | Invoices, Exports, Queues | ✅ Working |
| **Web** | Login Page | ✅ Exists — needs enterprise redesign from Stitch |
| **Web** | Register Page | ✅ Exists — needs enterprise redesign with role selection |
| **Web** | Landing Page | ✅ Exists — needs enterprise redesign |
| **Web** | CA Dashboard | ⚠️ Partial — needs full Command Center |
| **Mobile** | Business Screens | ⚠️ Exists — needs full redesign |

### What's Missing (❌ Must Build)

| Priority | Module | PRD Section |
|----------|--------|-------------|
| **P0** | Business Profile + Modes schema | §8.4 |
| **P0** | Progressive Catalog schema + service | §9.3, §13 |
| **P0** | CA Client Management (CRUD + workspace) | §14.7 |
| **P0** | CA Service Management | §14.8 |
| **P0** | CA Payment/Collection Tracking | §14.9 |
| **P0** | CA Document Storage | §14.10 |
| **P0** | Audit Trail / Edit Logs | §11.5 |
| **P1** | CA Task System (persistent) | §14.4.3 |
| **P1** | Knowledge Engine (structured data) | §14.11 |
| **P1** | Intelligence Engines (detection, prioritization, action) | §14.4 |
| **P1** | Web: Enterprise Login/Register from Stitch | New |
| **P1** | Web: CA Command Center | §14.3 |
| **P1** | Web: Client Workspace | §14.6 |
| **P1** | Web: Full sidebar navigation | All |
| **P2** | Mobile: Enterprise home redesign | §9.2 |
| **P2** | Mobile: Progressive catalog UI | §9.3 |
| **P2** | Web: Knowledge Engine UI | §14.11 |
| **P2** | Web: Landing page redesign | Positioning |

---

## Build Phases

### Phase 1: Backend Foundation (Schemas + Core APIs)

**Goal:** All data models and CRUD services ready.

#### 1A. New Schemas

1. **`business-profile.schema.ts`** — Business entity with modes (retail/wholesale/services/agency/workshop/mixed)
2. **`catalog-item.schema.ts`** — Progressive catalog with flexible attributes
3. **`ca-client.schema.ts`** — CA's client entity with health score
4. **`ca-service.schema.ts`** — Service assignments with period tracking
5. **`ca-payment.schema.ts`** — Client fee payments and collections
6. **`ca-document.schema.ts`** — Client document storage
7. **`ca-task.schema.ts`** — Persistent task system
8. **`audit-log.schema.ts`** — Immutable audit trail

#### 1B. New Modules

1. **`catalog/`** — Progressive catalog CRUD + auto-creation
2. **`ca-clients/`** — Client management + health score + workspace aggregation
3. **`ca-services/`** — Service assignment + status tracking
4. **`ca-payments/`** — Collection tracking + reminders
5. **`ca-documents/`** — Upload/download + completeness tracking
6. **`ca-tasks/`** — System + manual tasks + priority workflow
7. **`knowledge/`** — Structured process guides (top 5 MVP)
8. **`audit/`** — Edit trail logging

#### 1C. Modified Modules

1. **`caos/`** — Upgrade with detection + prioritization + action engines
2. **`auth/`** — Add business owner role, phone-based registration

---

### Phase 2: Web — Enterprise CA OS

**Goal:** Full intelligent workspace matching Stitch designs.

1. **Login/Register** — Rebuild from Stitch HTML output
2. **Landing Page** — Rebuild from Stitch design
3. **Layout** — New sidebar navigation (Command Center, Clients, Services, Payments, Documents, Tasks, Knowledge, Reports)
4. **Command Center** — Decision screen with urgency stats, focus cards, system suggestions
5. **Clients** — List view with health scores + individual client workspace
6. **Services** — Cross-client service tracking
7. **Payments** — Global pending/overdue view with actions
8. **Documents** — Upload/management with completeness
9. **Tasks** — Priority-based task management
10. **Knowledge** — Structured process guides with search

---

### Phase 3: Mobile — Enterprise Business OS (React Native)

**Goal:** Premium mobile experience using bare React Native and `@react-navigation`. The app must follow the exception-only workflow and 1-tap resolution UX model.

#### Application Architecture
- **Navigation:** `@react-navigation/bottom-tabs` and stack navigator.
- **State/Data:** `axios` for API calls to the NestJS backend and `react-native-sqlite-storage` for offline caching.
- **Styling:** Tailwind-equivalent utility classes or heavily structured React Native `StyleSheet` using the "Obsidian Architect" tokens.

#### Screens to Build/Redesign:
1. **Onboarding Flow (`src/screens/OnboardingScreen.tsx`)**
   - Goal: Business profile + Mode selection (retail, wholesale, services, etc.)
   - Pre-loads top 5 catalog items based on mode.
2. **Owner Home Screen (`src/screens/HomeScreen.tsx`)**
   - Goal: Command center for the business owner.
   - UI: "Today's summary", "Pending resolutions", and quick actions.
   - Focus: Never show raw unstructured data; only show actionable insights.
3. **1-Tap Resolution UI (`src/screens/ResolutionScreen.tsx`)**
   - Goal: Resolve unmatched queue and unknown payments with a single tap.
   - Uses the Progressive Catalog to suggest matching items.
4. **Catalog Management (`src/screens/CatalogScreen.tsx`)**
   - Goal: Progressive catalog listing.
   - Items group by Category/Type. No forced heavy data entry.
5. **Sale Entry (`src/screens/SaleEntryScreen.tsx`)**
   - Goal: Extremely fast capture using favorite items, templates, and the progressive catalog.

#### Verification
- Ensure `react-native run-android` compiles cleanly.
- Verify JWT auth flow exists and persists token securely.
- Confirm the new UI matches the established "High-Trust" tonal architecture.

---

### Phase 4: Polish & Integration

1. **Audit trail** integrated across all mutations
2. **Bridge** enhanced for CA ↔ Business connections
3. **Export** improvements (Tally format, GST reports)
4. **Mobile APK** build via GitHub Actions

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Naming | Keep "Showroom" internally, use "Business" in UI | Less risk, faster delivery |
| File Storage | Local filesystem initially | MVP speed, add S3 later |
| Build Priority | Backend first → Web CA OS → Mobile | Backend enables both frontends |
| Design System | Stitch "Obsidian Architect" | Enterprise-grade, consistent |
| Login/Signup | Rebuild from Stitch output | Part of enterprise experience |

---

## Verification Plan

### Backend
- `npm run test` for each new module
- Swagger API testing at `/api`
- Existing tests must continue passing

### Web
- Visual comparison against Stitch screenshots
- End-to-end flow: Login → Command Center → Client → Actions

### Mobile
- Metro bundle test locally
- GitHub Actions APK build
- Visual comparison against Stitch mobile design
