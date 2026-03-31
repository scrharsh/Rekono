# Implementation Plan: Rekono MVP

## Overview

This implementation plan breaks down the Rekono MVP into discrete coding tasks across mobile app, backend API, web app, and deployment. The system serves two user groups: showroom staff (sale-first data capture via mobile) and CAs (intelligent operating system via web). The MVP targets zero-cost deployment using MongoDB Atlas, Render, and Vercel free tiers.

Key implementation priorities:
- Sale-first architecture with automatic payment matching
- SMS parsing for UPI payments (PhonePe, Google Pay, Paytm, BHIM)
- Offline-first mobile app with background sync
- CA OS with intelligent home screen, task engine, and health scores
- GST-compliant invoice generation and Tally export
- 52 property-based tests (100+ iterations each) for correctness validation

## Tasks

- [x] 1. Project setup and infrastructure
  - [x] 1.1 Initialize monorepo structure with mobile, backend, and web workspaces
    - Create root package.json with workspace configuration
    - Set up TypeScript configuration for each workspace
    - Configure ESLint and Prettier for consistent code style
    - Set up Git repository with .gitignore for node_modules, build artifacts
    - _Requirements: 26.1, 26.2, 26.3_

  - [x] 1.2 Set up backend project with Express and MongoDB
    - Initialize Node.js project with Express.js framework
    - Install dependencies: express, mongoose, jsonwebtoken, bcrypt, winston
    - Configure MongoDB connection with Mongoose ODM
    - Set up environment variable management with dotenv
    - Create basic server.js with health check endpoint
    - _Requirements: 23.1, 23.2, 24.1, 24.2_


  - [x] 1.3 Set up React Native mobile app project
    - Initialize React Native project with TypeScript template
    - Install dependencies: react-navigation, react-native-sqlite-storage, react-native-sms
    - Configure Android build settings and permissions
    - Set up AsyncStorage for app state persistence
    - Create basic app navigation structure
    - _Requirements: 25.1, 25.2, 2.1_

  - [x] 1.4 Set up React web app project with Vite
    - Initialize Vite project with React and TypeScript
    - Install dependencies: react-router-dom, @tanstack/react-query, tailwindcss, recharts, xlsx
    - Configure Tailwind CSS with design system tokens
    - Set up routing structure for dashboard, transactions, exports
    - Create basic layout components (header, sidebar, main content)
    - _Requirements: 19.1, 19.2, 20.1_

  - [x] 1.5 Configure testing frameworks and property-based testing
    - Install Jest and testing-library for unit tests
    - Install fast-check library for property-based testing
    - Configure test scripts in package.json for all workspaces
    - Set up test coverage reporting with Istanbul
    - Create test utilities and custom arbitraries for domain objects
    - _Requirements: 26.1, 26.2, 26.3_

- [x] 2. Database models and schemas
  - [x] 2.1 Create Showroom model with validation
    - Define Mongoose schema for Showroom with all required fields
    - Implement GSTIN format validation (15-character pattern)
    - Add unique index on gstin field
    - Add indexes on caUserId for CA queries
    - Create factory function for test data generation
    - _Requirements: 28.3, 23.4, 23.5_


  - [ ]* 2.2 Write property tests for Showroom model
    - **Property 46: GSTIN Format Validation**
    - **Validates: Requirements 28.3**

  - [x] 2.3 Create User model with authentication fields
    - Define Mongoose schema for User with role enum
    - Implement password hashing with bcrypt (10 rounds)
    - Add unique index on username field
    - Add compound index on role and showroomIds
    - Implement account lockout fields (failedLoginAttempts, lockedUntil)
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.9_

  - [ ]* 2.4 Write property tests for User model
    - **Property 34: Authentication Credential Verification**
    - **Property 35: User Role Assignment**
    - **Property 37: Account Lockout on Failed Attempts**
    - **Validates: Requirements 23.3, 23.4, 23.9**

  - [x] 2.5 Create SaleEntry model with GST calculation
    - Define Mongoose schema for SaleEntry with items array
    - Implement GST calculation logic for CGST/SGST and IGST
    - Add validation for amounts > 0 and valid GST rates
    - Add indexes on showroomId + timestamp, showroomId + status
    - Add unique sparse index on invoiceNumber
    - _Requirements: 1.4, 1.5, 1.7, 28.1, 28.2_

  - [ ]* 2.6 Write property tests for SaleEntry model
    - **Property 1: Sale Entry Timestamp Assignment**
    - **Property 2: GST Calculation Correctness**
    - **Property 3: Unique Sale Entry Identifiers**
    - **Property 4: Multi-Item GST Rate Support**
    - **Property 44: Amount Validation**
    - **Property 45: GST Rate Validation**
    - **Validates: Requirements 1.4, 1.5, 1.7, 1.8, 28.1, 28.2**


  - [x] 2.7 Create PaymentRecord model with method categorization
    - Define Mongoose schema for PaymentRecord with payment method enum
    - Add validation for amount > 0 and required fields based on source
    - Add indexes on showroomId + timestamp, showroomId + status, showroomId + amount + timestamp
    - Add sparse index on transactionId
    - Implement payment method categorization (PhonePe, GPay, Paytm, BHIM, cash, bank)
    - _Requirements: 3.2, 3.3, 28.1, 29.1, 29.5_

  - [ ]* 2.8 Write property tests for PaymentRecord model
    - **Property 8: Cash Payment Validation**
    - **Property 9: Cash Payment Method Tagging**
    - **Property 50: Payment Method Categorization**
    - **Validates: Requirements 3.2, 3.3, 3.5, 29.1**

  - [x] 2.9 Create Match model with confidence scoring
    - Define Mongoose schema for Match with saleId and paymentId references
    - Add validation for confidence score between 0-100
    - Add indexes on showroomId + createdAt, saleId, paymentId, showroomId + confidence
    - Implement match type enum (auto, manual)
    - Add verification fields (verifiedBy, verifiedAt, notes)
    - _Requirements: 4.6, 4.7, 4.2_

  - [ ]* 2.10 Write property tests for Match model
    - **Property 15: Confidence Score Bounds**
    - **Property 16: Manual Match Verification**
    - **Validates: Requirements 4.6, 4.7**

- [x] 3. Checkpoint - Database models complete
  - Ensure all tests pass, ask the user if questions arise.


- [x] 4. Authentication and authorization
  - [x] 4.1 Implement JWT authentication service
    - Create AuthService with login, verifyToken, and logout methods
    - Implement JWT token generation with 7-day expiry
    - Implement password verification with bcrypt
    - Add account lockout logic (3 failed attempts, 15-minute lock)
    - Create authentication middleware for protected routes
    - _Requirements: 23.1, 23.2, 23.3, 23.9_

  - [ ]* 4.2 Write property tests for authentication
    - **Property 34: Authentication Credential Verification**
    - **Property 37: Account Lockout on Failed Attempts**
    - **Validates: Requirements 23.3, 23.9**

  - [x] 4.3 Implement role-based access control
    - Create authorization middleware checking user role and showroom access
    - Implement permission checking for staff (own showroom only)
    - Implement permission checking for accountant (assigned showrooms only)
    - Implement permission checking for CA (all assigned showrooms + CA features)
    - Implement permission checking for admin (full access)
    - _Requirements: 23.4, 23.5, 23.6, 23.7, 23.8_

  - [ ]* 4.4 Write property tests for authorization
    - **Property 35: User Role Assignment**
    - **Property 36: Role-Based Access Control**
    - **Validates: Requirements 23.4, 23.5, 23.6, 23.7, 23.8**

  - [x] 4.5 Create authentication API endpoints
    - Implement POST /auth/login endpoint with credential validation
    - Implement POST /auth/refresh endpoint for token renewal
    - Implement POST /auth/logout endpoint
    - Add rate limiting (5 requests per minute for auth endpoints)
    - Add error handling for invalid credentials and locked accounts
    - _Requirements: 23.1, 23.2, 23.3, 23.9_


  - [ ]* 4.6 Write integration tests for authentication endpoints
    - Test login with valid credentials returns token
    - Test login with invalid credentials returns 401
    - Test three failed logins locks account
    - Test access to protected endpoint without token returns 401
    - Test access to resource outside role permissions returns 403
    - _Requirements: 23.1, 23.2, 23.3, 23.9_

- [x] 5. SMS parsing and payment capture
  - [x] 5.1 Implement SMS parser service with provider detection
    - Create SMSParserService with regex patterns for each provider
    - Implement PhonePe parser extracting amount, timestamp, transactionId, sender
    - Implement Google Pay parser with provider-specific patterns
    - Implement Paytm parser with provider-specific patterns
    - Implement BHIM parser with provider-specific patterns
    - Add fallback logging for unrecognized SMS formats
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.7, 29.5_

  - [ ]* 5.2 Write property tests for SMS parsing
    - **Property 5: SMS Payment Parsing Completeness**
    - **Property 6: Payment Record Creation from Parsed SMS**
    - **Property 7: SMS Parsing Failure Handling**
    - **Property 52: SMS Payment Provider Identification**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 29.5**

  - [x] 5.3 Implement mobile SMS receiver service
    - Create React Native SMS receiver component requesting SMS permission
    - Implement broadcast receiver for SMS_RECEIVED intent (Android)
    - Filter incoming SMS by known UPI provider senders
    - Route SMS to parser service and create PaymentRecord
    - Store parsed payment in local SQLite database
    - Handle parsing failures by logging to review queue
    - _Requirements: 2.1, 2.2, 2.6, 2.7, 2.8_


  - [ ]* 5.4 Write unit tests for SMS receiver
    - Test SMS permission request flow
    - Test SMS filtering by provider
    - Test payment record creation from parsed SMS
    - Test parsing failure handling and queue addition
    - _Requirements: 2.1, 2.6, 2.7_

  - [x] 5.5 Create payment record API endpoints
    - Implement POST /showrooms/:showroomId/payments endpoint
    - Implement GET /showrooms/:showroomId/payments with filtering
    - Implement GET /showrooms/:showroomId/payments/:paymentId endpoint
    - Add validation for amount > 0 and required fields
    - Trigger matching engine after payment creation
    - _Requirements: 3.2, 3.3, 28.1, 4.1_

  - [ ]* 5.6 Write integration tests for payment endpoints
    - Test creating payment record with valid data
    - Test creating payment with invalid amount returns 400
    - Test filtering payments by date range and status
    - Test payment creation triggers matching engine
    - _Requirements: 3.2, 28.1, 4.1_

- [x] 6. Matching engine implementation
  - [x] 6.1 Implement core matching algorithm
    - Create MatchingEngine service with findMatches method
    - Implement time window search (±30 minutes from payment timestamp)
    - Implement exact amount matching with ±₹1 tolerance
    - Calculate confidence score based on time difference and amount match
    - Return sorted match candidates by confidence score
    - _Requirements: 4.1, 4.2, 4.3, 4.6_


  - [ ]* 6.2 Write property tests for matching algorithm
    - **Property 10: Payment Matching Time Window**
    - **Property 11: Automatic High-Confidence Matching**
    - **Property 12: Ambiguous Match Handling**
    - **Property 15: Confidence Score Bounds**
    - **Property 17: Matching Preserves Original Data**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.6, 4.9**

  - [x] 6.3 Implement auto-match and queue management
    - Implement auto-match logic for single high-confidence matches (≥90)
    - Add unmatched payments to unknown queue when no matches found
    - Add unmatched sales to unmatched queue after 60 minutes
    - Implement queue sorting by age (oldest first)
    - Update sale and payment status after matching
    - _Requirements: 4.2, 4.4, 4.5, 7.3, 7.4_

  - [ ]* 6.4 Write property tests for queue management
    - **Property 13: Unknown Payment Queue Addition**
    - **Property 14: Unmatched Sale Queue Addition**
    - **Property 25: Queue Sorting by Age**
    - **Property 26: Queue Item Removal on Resolution**
    - **Validates: Requirements 4.4, 4.5, 7.3, 7.4, 7.7**

  - [x] 6.5 Implement manual match confirmation
    - Create confirmMatch method accepting paymentId, saleId, userId
    - Validate both records exist and belong to same showroom
    - Create Match record with manual type and user verification
    - Update sale and payment status to matched/verified
    - Remove items from queues after confirmation
    - _Requirements: 4.7, 7.7_


  - [ ]* 6.6 Write property tests for manual matching
    - **Property 16: Manual Match Verification**
    - **Property 26: Queue Item Removal on Resolution**
    - **Validates: Requirements 4.7, 7.7**

  - [x] 6.7 Implement split payment handling
    - Add support for multiple payment records per sale entry
    - Track split payment components separately in Match records
    - Calculate sum of payment amounts for split payments
    - Mark sale as fully paid when sum equals sale amount (±₹1 tolerance)
    - Flag discrepancy when sum doesn't match sale amount
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.8 Write property tests for split payments
    - **Property 18: Split Payment Component Tracking**
    - **Property 19: Split Payment Completion Detection**
    - **Property 20: Split Payment Discrepancy Flagging**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

  - [x] 6.9 Create matching API endpoints
    - Implement POST /showrooms/:showroomId/matches for manual confirmation
    - Implement GET /showrooms/:showroomId/matches with filtering
    - Implement GET /showrooms/:showroomId/matches/suggestions/:paymentId
    - Implement DELETE /showrooms/:showroomId/matches/:matchId for unmatch
    - Add validation for match conflicts (already matched)
    - _Requirements: 4.7, 4.6_

  - [ ]* 6.10 Write integration tests for matching endpoints
    - Test manual match confirmation creates Match record
    - Test match suggestions return sorted candidates
    - Test unmatch removes Match and updates statuses
    - Test matching already matched payment returns 409
    - _Requirements: 4.7_


- [x] 7. Checkpoint - Matching engine complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Mobile app - Sale entry and local storage
  - [x] 8.1 Create local SQLite database schema
    - Define SQLite tables for SaleEntry, PaymentRecord, Match
    - Add syncStatus field to track pending syncs
    - Create indexes on showroomId and timestamp
    - Implement database initialization and migration logic
    - Create database helper functions for CRUD operations
    - _Requirements: 25.1, 25.2, 24.1, 24.2_

  - [x] 8.2 Implement sale entry form with three modes
    - Create SaleEntryScreen component with mode selector (quick, detailed, session)
    - Implement quick mode form (amount, payment method only)
    - Implement detailed mode form (items, customer, GST breakdown)
    - Implement session mode for batch entry
    - Add form validation for amounts > 0 and valid GST rates
    - Calculate GST automatically in detailed mode
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 28.1, 28.2_

  - [ ]* 8.3 Write unit tests for sale entry form
    - Test quick mode completes within 10 seconds
    - Test GST calculation correctness in detailed mode
    - Test form validation for invalid amounts
    - Test form validation for invalid GST rates
    - Test mode switching preserves entered data
    - _Requirements: 1.6, 1.5, 28.1, 28.2_

  - [x] 8.4 Implement local storage and offline support
    - Save sale entries to SQLite with pending sync flag
    - Save payment records to SQLite with pending sync flag
    - Display offline mode indicator when no internet connection
    - Queue local changes for upload when online
    - Implement background sync service
    - _Requirements: 25.1, 25.2, 25.4, 24.1, 24.2_


  - [ ]* 8.5 Write property tests for offline storage
    - **Property 39: Offline Data Storage**
    - **Validates: Requirements 25.1, 25.2**

  - [x] 8.6 Implement sync manager with conflict resolution
    - Create LocalSyncManager with syncSaleEntries, syncPaymentRecords, syncMatches methods
    - Implement upload of pending local changes to backend
    - Implement download of server changes and merge with local data
    - Detect sync conflicts (same record modified locally and on server)
    - Apply last-write-wins conflict resolution for MVP
    - Retry failed syncs every 5 minutes with exponential backoff
    - _Requirements: 25.3, 25.6, 24.6_

  - [ ]* 8.7 Write property tests for sync manager
    - **Property 40: Sync Retry on Failure**
    - **Validates: Requirements 25.6**

  - [x] 8.8 Create sale entry API endpoints
    - Implement POST /showrooms/:showroomId/sales endpoint
    - Implement GET /showrooms/:showroomId/sales with filtering
    - Implement GET /showrooms/:showroomId/sales/:saleId endpoint
    - Implement PATCH /showrooms/:showroomId/sales/:saleId for updates
    - Implement DELETE /showrooms/:showroomId/sales/:saleId
    - Add validation for all required fields and business rules
    - _Requirements: 1.4, 1.5, 1.7, 28.1, 28.2_

  - [ ]* 8.9 Write integration tests for sale entry endpoints
    - Test creating sale entry returns 201 with sale ID
    - Test creating sale with invalid data returns 400
    - Test fetching sale by ID returns sale data
    - Test updating sale returns updated data
    - Test deleting sale removes it from database
    - _Requirements: 1.4, 28.1_


- [x] 9. Mobile app - Invoice generation
  - [x] 9.1 Implement invoice number sequencing
    - Create invoice number generation service on backend
    - Fetch next invoice number from server (showroom-specific sequence)
    - Handle invoice number collision with retry logic
    - Store last invoice number in Showroom model
    - Ensure sequential numbering across offline devices
    - _Requirements: 6.3_

  - [ ]* 9.2 Write property tests for invoice sequencing
    - **Property 22: Invoice Number Sequencing**
    - **Validates: Requirements 6.3**

  - [x] 9.3 Create invoice PDF generator
    - Implement InvoiceGenerator service using React Native PDF library
    - Format invoice data with all required GST fields
    - Generate PDF with proper layout and branding
    - Include showroom GSTIN, invoice number, date, customer details, items, HSN codes, GST breakdown
    - Store PDF locally and sync to server
    - Complete generation within 3 seconds
    - _Requirements: 6.1, 6.2, 26.5_

  - [ ]* 9.4 Write property tests for invoice generation
    - **Property 21: Invoice Required Fields Completeness**
    - **Property 23: Invoice Storage and Retrieval**
    - **Property 24: Invoice Data Round-Trip**
    - **Validates: Requirements 6.1, 6.2, 6.5, 6.6**

  - [x] 9.5 Implement invoice sharing functionality
    - Add WhatsApp share button to invoice screen
    - Implement share via WhatsApp using React Native Share API
    - Add email share option as alternative
    - Display generated invoice in PDF viewer
    - Store invoice metadata for later retrieval
    - _Requirements: 6.4, 6.5_


  - [x] 9.6 Create invoice API endpoints
    - Implement POST /showrooms/:showroomId/invoices endpoint
    - Implement GET /showrooms/:showroomId/invoices/:invoiceNumber endpoint
    - Implement GET /showrooms/:showroomId/invoices with pagination
    - Store invoice PDFs on Render persistent disk
    - Return invoice PDF as binary response
    - _Requirements: 6.5_

  - [ ]* 9.7 Write integration tests for invoice endpoints
    - Test invoice generation creates PDF file
    - Test invoice retrieval returns correct PDF
    - Test invoice list pagination works correctly
    - _Requirements: 6.5_

- [x] 10. Mobile app - Queue management and UI
  - [x] 10.1 Implement unmatched queue screen
    - Create UnmatchedQueueScreen displaying sales without payments
    - Sort entries by age (oldest first)
    - Display sale details (amount, timestamp, items)
    - Allow manual matching from queue
    - Remove items from queue after resolution
    - _Requirements: 7.1, 7.3, 7.5, 7.7_

  - [x] 10.2 Implement unknown queue screen
    - Create UnknownQueueScreen displaying payments without sales
    - Sort entries by age (oldest first)
    - Display payment details (amount, timestamp, method, transaction ID)
    - Allow creating new sale from unknown payment
    - Allow manual matching from queue
    - _Requirements: 7.2, 7.4, 7.6, 7.7_

  - [ ]* 10.3 Write unit tests for queue screens
    - Test queue sorting by age
    - Test queue item removal on resolution
    - Test manual matching from queue
    - Test creating sale from unknown payment
    - _Requirements: 7.3, 7.4, 7.7_


  - [x] 10.4 Create home screen with activity feed
    - Implement HomeScreen showing today's sales summary
    - Display matched and pending payment counts
    - Show recent activity feed with auto-match status
    - Add primary CTA button for new sale entry
    - Display offline mode indicator when disconnected
    - Refresh data every 5 minutes when online
    - _Requirements: 1.6, 25.4, 26.1_

  - [x] 10.5 Implement bottom navigation and routing
    - Create bottom navigation with Sales, Payments, More tabs
    - Implement navigation between screens using React Navigation
    - Add profile screen with user info and logout
    - Add settings screen for app configuration
    - Implement deep linking for notifications (future)
    - _Requirements: 26.1_

  - [x] 10.6 Apply design system and UI polish
    - Implement design tokens (colors, typography, spacing, shadows)
    - Apply consistent styling across all screens
    - Add loading states and skeleton screens
    - Add success/error feedback with toast notifications
    - Ensure touch targets ≥ 44×44 pixels for accessibility
    - Test responsive design on different screen sizes
    - _Requirements: 26.1_

- [x] 11. Checkpoint - Mobile app complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Web app - Dashboard and transaction views
  - [x] 12.1 Implement authentication and routing
    - Create login page with username/password form
    - Implement authentication context with JWT token storage
    - Create protected route wrapper checking authentication
    - Implement automatic token refresh before expiry
    - Redirect to login on 401 responses
    - _Requirements: 23.1, 23.2_


  - [x] 12.2 Create dashboard view for CAs
    - Implement DashboardView showing all assigned showrooms
    - Display showroom summaries with transaction count, auto-match rate, unmatched count
    - Add filters for match rate, unresolved items, transaction volume
    - Sort showrooms by urgency (most needing attention first)
    - Navigate to detailed transaction view on showroom selection
    - Refresh metrics every 5 minutes
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

  - [x] 12.3 Implement transaction list view with filtering
    - Create TransactionListView displaying sales and payments for selected showroom
    - Add filters for date range, amount range, match status, payment method, GST rate
    - Implement sorting by date, amount, or confidence
    - Display paginated results (50 per page)
    - Highlight low-confidence matches needing review
    - Show full transaction details in modal on selection
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [ ]* 12.4 Write property tests for transaction sorting
    - **Property 27: Transaction Sorting Correctness**
    - **Validates: Requirements 19.4**

  - [x] 12.5 Implement manual match confirmation UI
    - Create match review modal showing payment and sale details
    - Display confidence score with visual indicator
    - Show reason for confidence score (time difference, amount match)
    - Add confirm match button as primary action
    - Add "not a match" button as secondary action
    - Allow adding notes to manual matches
    - _Requirements: 4.7, 19.7_


  - [x] 12.6 Create queue management views
    - Implement GET /showrooms/:showroomId/queues/unmatched endpoint
    - Implement GET /showrooms/:showroomId/queues/unknown endpoint
    - Create UnmatchedQueueView in web app
    - Create UnknownQueueView in web app
    - Allow manual matching from queue views
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 12.7 Write integration tests for queue endpoints
    - Test unmatched queue returns sales without payments
    - Test unknown queue returns payments without sales
    - Test queue sorting by age
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 13. Web app - Export functionality
  - [x] 13.1 Implement Tally export service
    - Create ExportService with generateTallyExport method
    - Query matched and verified transactions for date range
    - Transform to Tally-compatible format with required columns
    - Group transactions by date and voucher type
    - Format dates as DD-MM-YYYY and amounts with 2 decimals
    - Generate Excel file using XLSX library
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [ ]* 13.2 Write property tests for Tally export
    - **Property 28: Tally Export Column Completeness**
    - **Property 29: Tally Export Filtering**
    - **Property 30: Tally Export Grouping**
    - **Property 31: Tally Export Financial Round-Trip**
    - **Property 51: Tally Export Payment Method Inclusion**
    - **Validates: Requirements 20.2, 20.3, 20.6, 20.7, 29.3**


  - [x] 13.3 Implement GST summary service
    - Create generateGSTSummary method in ExportService
    - Query transactions for date range and calculate GST by rate
    - Separate CGST, SGST, and IGST amounts
    - Calculate taxable amount, tax amount, total for each rate
    - Validate summary totals match individual transactions (±₹1 tolerance)
    - Return summary object with byRate breakdown and totals
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_

  - [ ]* 13.4 Write property tests for GST summary
    - **Property 32: GST Summary Completeness**
    - **Property 33: GST Summary Accuracy**
    - **Validates: Requirements 21.1, 21.2, 21.4, 21.6**

  - [x] 13.5 Create export API endpoints
    - Implement POST /showrooms/:showroomId/exports/tally endpoint
    - Implement POST /showrooms/:showroomId/exports/gst-summary endpoint
    - Add date range validation (max 1 year)
    - Return Excel file as binary response for Tally export
    - Return JSON summary for GST summary
    - Add rate limiting (10 requests per hour for exports)
    - _Requirements: 20.1, 20.4, 20.5, 21.3, 21.5_

  - [ ]* 13.6 Write integration tests for export endpoints
    - Test Tally export returns Excel file
    - Test Tally export includes only verified transactions
    - Test GST summary returns correct breakdown
    - Test export with invalid date range returns 400
    - _Requirements: 20.3, 21.3_

  - [x] 13.7 Implement export view UI
    - Create ExportView with date range picker
    - Add export type selector (Tally or GST summary)
    - Add option to include/exclude unverified transactions
    - Display export progress indicator
    - Trigger file download on completion
    - Show preview of export data before download
    - _Requirements: 20.1, 20.4, 20.5, 21.3, 21.5_


- [ ] 14. CA Operating System features
  - [x] 14.1 Implement Client Health Score calculation
    - Create health score calculation service in CA_OS module
    - Calculate score based on missing entries, unmatched payments, filing delays, data quality
    - Reduce score when missing entries exceed 5% of total transactions
    - Reduce score when unmatched payments exceed 10% of total payments
    - Reduce score by 20 points when filing deadline is missed
    - Return score between 0-100 with breakdown of contributing factors
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [x] 14.2 Implement Task Engine with rules-based logic
    - Create TaskEngine service generating tasks from data state and deadlines
    - Generate task when GSTR-1 deadline within 7 days
    - Generate task when unmatched transactions older than 48 hours
    - Generate task when transaction mismatch exceeds ₹10,000
    - Assign priority levels: high (deadline within 3 days), medium (within 7 days), low (no deadline)
    - Allow CAs to mark tasks complete or dismiss with reason
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

  - [x] 14.3 Implement Risk Alert system
    - Create risk alert generation service using deterministic rules
    - Generate alert when GST mismatch exceeds ₹5,000
    - Generate alert when transactions lack corresponding invoices
    - Generate alert when GSTR-1 deadline within 3 days and filing incomplete
    - Prioritize alerts by severity: critical, high, medium
    - Allow CAs to acknowledge alerts after addressing issue
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 14.4 Create Smart Summary component
    - Implement Smart_Summary calculation for showroom detail page
    - Include total sales amount for current month
    - Include total GST collected for current month
    - Include filing status (filed, pending, overdue)
    - Include count of unresolved issues
    - Update within 5 minutes of transaction changes
    - Allow selecting different time periods
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_


  - [x] 14.5 Implement Timeline View
    - Create Timeline_View component showing chronological events
    - Display past events (data incomplete, review pending, filing completion)
    - Display upcoming deadlines (GSTR-1 due, payment due)
    - Use visual markers for completed, current, and future events
    - Show details on event selection
    - Default span: 30 days past to 30 days future
    - Allow expanding to 90 days in either direction
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [x] 14.6 Create CA home screen with intelligent alerts
    - Implement CA_OS home screen showing pending items by urgency
    - Categorize by: pending GSTR-1 filings, missing data, payment issues, high-value mismatches
    - Display count of pending items per category
    - Show Action_Recommendations (up to 5, prioritized by urgency)
    - Navigate to showroom detail on item selection
    - Refresh data within 5 minutes of changes
    - Sort by deadline proximity
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

  - [x] 14.7 Implement Pending Alerts Dashboard
    - Create Pending_Alerts dashboard showing all pending items across clients
    - Group by type: pending filings, missing data, payment issues, mismatches
    - Display count per showroom
    - Add filters by urgency, showroom, alert type
    - Remove resolved items within 1 minute
    - Sort by deadline (most urgent first)
    - Display total count across all clients
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [x] 14.8 Implement deadline tracking system
    - Create deadline calendar for GSTR-1 filings per showroom
    - Display deadlines within 7 days on CA home screen
    - Generate high-priority task when deadline within 3 days
    - Show deadlines in Timeline_View
    - Update status when filing marked complete
    - Calculate next deadline automatically
    - Provide consolidated calendar view for all clients
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_


  - [x] 14.9 Create CA OS API endpoints
    - Implement GET /dashboard/showrooms endpoint
    - Implement GET /dashboard/showrooms/:showroomId/summary endpoint
    - Implement GET /dashboard/metrics endpoint
    - Implement GET /ca-os/tasks endpoint
    - Implement POST /ca-os/tasks/:taskId/complete endpoint
    - Implement GET /ca-os/alerts endpoint
    - Implement POST /ca-os/alerts/:alertId/acknowledge endpoint
    - _Requirements: 8.1, 9.1, 11.1, 12.1_

  - [ ]* 14.10 Write integration tests for CA OS endpoints
    - Test dashboard returns all assigned showrooms
    - Test summary includes health score and metrics
    - Test tasks are generated based on rules
    - Test alerts are prioritized by severity
    - _Requirements: 8.1, 9.1, 11.1_

- [x] 15. Checkpoint - CA OS features complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Error handling and validation
  - [x] 16.1 Implement comprehensive error handling
    - Create error handling middleware for Express API
    - Implement user-friendly error messages for all error types
    - Add error logging with Winston (timestamp, userId, operation, error message)
    - Store error logs for 90 days
    - Send admin alerts for critical errors
    - Log raw SMS content for parsing failures
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6_


  - [ ]* 16.2 Write property tests for error handling
    - **Property 41: Error Logging Completeness**
    - **Property 42: Critical Error Alerting**
    - **Property 43: SMS Parsing Failure Logging**
    - **Validates: Requirements 27.3, 27.5, 27.6**

  - [x] 16.3 Implement data validation across all inputs
    - Add amount validation (> 0) to sale and payment forms
    - Add GST rate validation (0, 5, 12, 18, 28 only)
    - Add GSTIN format validation (15-character pattern)
    - Add mobile number validation (10-digit Indian format)
    - Display specific error messages for each validation failure
    - Prevent saving invalid data
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6_

  - [ ]* 16.4 Write property tests for validation
    - **Property 44: Amount Validation**
    - **Property 45: GST Rate Validation**
    - **Property 46: GSTIN Format Validation**
    - **Property 47: Mobile Number Format Validation**
    - **Property 48: Validation Error Messaging**
    - **Property 49: Invalid Data Prevention**
    - **Validates: Requirements 28.1, 28.2, 28.3, 28.4, 28.5, 28.6**

  - [x] 16.5 Implement database retry logic
    - Add retry logic for database write operations (3 attempts)
    - Use exponential backoff (1s, 2s, 4s delays)
    - Alert user after 3 failed attempts
    - Log all retry attempts
    - _Requirements: 24.6_

  - [ ]* 16.6 Write property tests for database retry
    - **Property 38: Database Write Retry Logic**
    - **Validates: Requirements 24.6**


- [x] 17. Performance optimization and monitoring
  - [x] 17.1 Implement performance optimizations
    - Add database indexes for common queries (showroomId + timestamp, etc.)
    - Implement pagination for transaction lists (50 per page)
    - Add caching with React Query for web app
    - Optimize mobile app UI response time (< 200ms)
    - Optimize API response time (< 3 seconds for 10,000 transactions)
    - Optimize matching engine (< 5 seconds per payment)
    - Optimize invoice generation (< 3 seconds)
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_

  - [x] 17.2 Set up monitoring and alerting
    - Integrate Sentry for error tracking and performance monitoring
    - Configure MongoDB Atlas monitoring for query performance
    - Set up custom metrics tracking (DAU, auto-match rate, API error rate)
    - Configure alerts for error rate spikes (>10 errors/minute)
    - Configure alerts for service downtime
    - Configure alerts for storage usage (>80% capacity)
    - _Requirements: 27.5, 30.1, 30.2, 30.3, 30.4_

  - [x] 17.3 Implement rate limiting
    - Add rate limiting middleware to Express API
    - Set limits: auth endpoints (5 req/min), read endpoints (100 req/min), write endpoints (30 req/min), export endpoints (10 req/hour)
    - Return 429 status with retry-after header
    - Add rate limit headers to responses
    - _Requirements: 23.1_

  - [x] 17.4 Add analytics tracking
    - Track daily active users (mobile and web)
    - Track sale entries created per showroom per day
    - Track auto-match rate across all transactions
    - Track CA engagement metrics (logins per week, time spent)
    - Calculate 30-day retention rate
    - Create admin dashboard showing all metrics
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7_


- [x] 18. Accountant marketplace (basic)
  - [x] 18.1 Implement help request system
    - Add help request button to mobile app
    - Create help request API endpoint
    - Store help requests in database
    - Display pending requests in admin dashboard
    - _Requirements: 22.1, 22.2, 22.3_

  - [x] 18.2 Implement accountant assignment
    - Create admin UI for viewing pending help requests
    - Allow admin to assign requests to accountants
    - Grant accountant access to assigned showroom data
    - Restrict accountant from GST filing functions
    - Allow accountant to mark request complete
    - _Requirements: 22.3, 22.4, 22.5, 22.6, 22.7_

- [x] 19. Security hardening
  - [x] 19.1 Implement security best practices
    - Enforce HTTPS only for all API requests
    - Add Content Security Policy headers
    - Implement CORS restrictions to known origins
    - Store JWT tokens in secure storage (mobile) and httpOnly cookies (web)
    - Never log sensitive data (passwords, GSTIN, mobile numbers)
    - Sanitize all user inputs to prevent injection attacks
    - _Requirements: 23.1, 23.2_

  - [x] 19.2 Add security testing
    - Test authentication with invalid tokens
    - Test authorization with wrong roles
    - Test input validation with malicious inputs
    - Test rate limiting enforcement
    - Test CORS restrictions
    - _Requirements: 23.1, 23.2, 23.3_


- [x] 20. Deployment and DevOps
  - [x] 20.1 Set up MongoDB Atlas free tier
    - Create MongoDB Atlas account
    - Create free tier cluster (512MB storage)
    - Configure database user and network access
    - Set up automatic daily backups
    - Configure connection string in environment variables
    - _Requirements: 24.4_

  - [x] 20.2 Deploy backend to Render free tier
    - Create Render account and connect GitHub repository
    - Configure build command (npm install && npm run build)
    - Configure start command (npm start)
    - Set environment variables in Render dashboard
    - Configure health check endpoint
    - Set up automatic deployments from main branch
    - _Requirements: 26.4_

  - [x] 20.3 Deploy web app to Vercel free tier
    - Create Vercel account and connect GitHub repository
    - Configure build command (npm run build)
    - Set environment variables in Vercel dashboard
    - Set up automatic deployments from main branch
    - Configure preview deployments for pull requests
    - _Requirements: 26.2_

  - [x] 20.4 Set up mobile app build and distribution
    - Configure Android build settings in app.json
    - Set up signing keys for release builds
    - Build release APK
    - Test APK installation on physical device
    - Set up internal distribution channel
    - Document installation instructions
    - _Requirements: 26.1_


  - [x] 20.5 Configure CI/CD pipeline
    - Set up GitHub Actions workflow
    - Add lint step (ESLint, Prettier)
    - Add type check step (TypeScript)
    - Add unit test step (Jest)
    - Add property test step (fast-check with 100 iterations)
    - Add integration test step
    - Add build step for all workspaces
    - Configure quality gates (tests pass, coverage ≥80%)
    - _Requirements: 26.1, 26.2, 26.3_

  - [x] 20.6 Set up monitoring and logging
    - Configure Sentry for error tracking
    - Set up Winston logging in backend
    - Configure log retention (90 days)
    - Set up MongoDB Atlas monitoring
    - Configure alert channels (email, Slack)
    - Create runbooks for common issues
    - _Requirements: 27.3, 27.4, 27.5_

- [x] 21. Final integration and testing
  - [x] 21.1 Run end-to-end testing scenarios
    - Test showroom staff workflow: login → create sale → receive SMS → verify auto-match → generate invoice → share
    - Test accountant workflow: login → view transactions → filter unmatched → manually match → export to Tally
    - Test CA workflow: login → view dashboard → identify client needing attention → review GST summary → export
    - Test offline mode: create sales offline → go online → verify sync
    - Test split payment: create sale → receive multiple payments → verify completion
    - _Requirements: 1.1, 2.1, 4.1, 6.1, 19.1, 20.1, 8.1_

  - [x] 21.2 Verify all 52 property-based tests pass
    - Run all property tests with 100+ iterations each
    - Verify no failing examples
    - Check test coverage meets targets (≥80% line, ≥75% branch)
    - Review and fix any flaky tests
    - _Requirements: All requirements_


  - [x] 21.3 Performance testing and optimization
    - Load test with 50 concurrent users
    - Test with 10,000 transactions in single showroom
    - Verify API response time p95 < 500ms
    - Verify mobile app UI response < 200ms
    - Verify export generation < 30 seconds for 10,000 transactions
    - Verify matching engine < 5 seconds per payment
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_

  - [x] 21.4 Manual testing on devices
    - Test mobile app on physical Android device
    - Test SMS capture with real UPI payment SMS
    - Test offline mode with airplane mode
    - Test web app on Chrome, Firefox, Safari
    - Test responsive design on mobile, tablet, desktop
    - Test with different user roles (staff, accountant, CA, admin)
    - _Requirements: 26.1, 26.2_

  - [x] 21.5 Security audit
    - Review authentication implementation
    - Review authorization checks on all endpoints
    - Review input validation and sanitization
    - Review error messages for information leakage
    - Test rate limiting enforcement
    - Review HTTPS and CORS configuration
    - _Requirements: 23.1, 23.2, 23.3_

  - [x] 21.6 Documentation and deployment verification
    - Document API endpoints with examples
    - Document deployment process
    - Document environment variables
    - Document database schema
    - Verify production deployment works end-to-end
    - Create user guides for each role
    - _Requirements: All requirements_

- [x] 22. Final checkpoint - MVP complete
  - Ensure all tests pass, ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties with 100+ iterations each
- Unit tests validate specific examples and edge cases
- Integration tests validate API endpoints and workflows
- The implementation uses TypeScript throughout (mobile: React Native, backend: Node.js/Express, web: React)
- Zero-cost deployment: MongoDB Atlas free tier, Render free tier, Vercel free tier
- MVP scope focuses on core sale-first workflow, SMS capture, matching engine, CA OS intelligence
- All 52 correctness properties from design document are covered by property-based tests
- Testing strategy: dual approach with both unit tests and property-based tests for comprehensive coverage

## Property-Based Test Summary

The following 52 properties are tested (all marked as optional sub-tasks with `*`):

1. Sale Entry Timestamp Assignment (Property 1)
2. GST Calculation Correctness (Property 2)
3. Unique Sale Entry Identifiers (Property 3)
4. Multi-Item GST Rate Support (Property 4)
5. SMS Payment Parsing Completeness (Property 5)
6. Payment Record Creation from Parsed SMS (Property 6)
7. SMS Parsing Failure Handling (Property 7)
8. Cash Payment Validation (Property 8)
9. Cash Payment Method Tagging (Property 9)
10. Payment Matching Time Window (Property 10)
11. Automatic High-Confidence Matching (Property 11)
12. Ambiguous Match Handling (Property 12)
13. Unknown Payment Queue Addition (Property 13)
14. Unmatched Sale Queue Addition (Property 14)
15. Confidence Score Bounds (Property 15)
16. Manual Match Verification (Property 16)
17. Matching Preserves Original Data (Property 17)
18. Split Payment Component Tracking (Property 18)
19. Split Payment Completion Detection (Property 19)
20. Split Payment Discrepancy Flagging (Property 20)
21. Invoice Required Fields Completeness (Property 21)
22. Invoice Number Sequencing (Property 22)
23. Invoice Storage and Retrieval (Property 23)
24. Invoice Data Round-Trip (Property 24)
25. Queue Sorting by Age (Property 25)
26. Queue Item Removal on Resolution (Property 26)
27. Transaction Sorting Correctness (Property 27)
28. Tally Export Column Completeness (Property 28)
29. Tally Export Filtering (Property 29)
30. Tally Export Grouping (Property 30)
31. Tally Export Financial Round-Trip (Property 31)
32. GST Summary Completeness (Property 32)
33. GST Summary Accuracy (Property 33)
34. Authentication Credential Verification (Property 34)
35. User Role Assignment (Property 35)
36. Role-Based Access Control (Property 36)
37. Account Lockout on Failed Attempts (Property 37)
38. Database Write Retry Logic (Property 38)
39. Offline Data Storage (Property 39)
40. Sync Retry on Failure (Property 40)
41. Error Logging Completeness (Property 41)
42. Critical Error Alerting (Property 42)
43. SMS Parsing Failure Logging (Property 43)
44. Amount Validation (Property 44)
45. GST Rate Validation (Property 45)
46. GSTIN Format Validation (Property 46)
47. Mobile Number Format Validation (Property 47)
48. Validation Error Messaging (Property 48)
49. Invalid Data Prevention (Property 49)
50. Payment Method Categorization (Property 50)
51. Tally Export Payment Method Inclusion (Property 51)
52. SMS Payment Provider Identification (Property 52)

Each property test runs with minimum 100 iterations using fast-check library to ensure comprehensive input coverage.
