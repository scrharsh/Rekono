# Requirements Document

## Introduction

Rekono is a dual-purpose system that serves two distinct user groups:

**For Stores**: A sale-first data capture system that converts real-world showroom sales into clean, structured, GST-ready business data. The system bridges the gap between physical showroom transactions (UPI, bank transfers, cash) and accounting systems like Tally, minimizing manual data entry and reconciliation effort.

**For CAs**: An intelligent operating system that transforms raw business data into actionable insights and workflow management. Rather than simply displaying data or providing exports, Rekono acts as a CA's command center, answering the critical question: "What should I do next?" The CA OS manages work, deadlines, clients, and decisions through three layers: data visibility (clean transactions, GST-ready data), workflow system (tasks, deadlines, status), and intelligence layer (pending items, risk detection, action recommendations).

Rekono targets GST-registered showrooms with ₹50L–₹5Cr revenue that experience heavy UPI usage and manual reconciliation pain, along with their Chartered Accountants and bookkeepers.

The system operates on core principles: sale-first (not payment-first), no extra work for staff, human-in-the-loop validation, ambiguity resolution at sale time, multi-source payment capture, action-driven intelligence (not just data display), and rules-based recommendations that prioritize trust over blind automation.

## Glossary

- **Store_Mobile_App**: Android mobile application used by showroom staff to record sales and capture payments
- **Sale_Entry**: A record of items sold, customer details, and GST information created at the point of sale
- **Payment_Record**: A transaction record extracted from SMS notifications (UPI, bank) or manually entered (cash)
- **Matching_Engine**: The component that associates Payment_Records with Sale_Entries based on amount, timing, and context
- **Web_App**: Browser-based application used by CAs and accountants to review, clean, and export transaction data
- **CA**: Chartered Accountant who manages multiple client showrooms, makes decisions on GST compliance, and requires actionable intelligence to prioritize work
- **Accountant**: Freelance bookkeeper who performs data cleanup tasks but does not file GST returns
- **CA_OS**: The intelligent operating system layer that transforms data into actionable tasks, alerts, and recommendations for CAs
- **Task_Engine**: Component that automatically generates action items based on data state, deadlines, and business rules
- **Client_Health_Score**: A calculated metric (0-100) indicating data quality, compliance status, and risk level for a Showroom
- **Risk_Alert**: A system-generated warning about potential compliance issues, data gaps, or deadline risks
- **Smart_Summary**: A concise, actionable overview of a client's status including key metrics and pending actions
- **Timeline_View**: A chronological display of past events and upcoming deadlines for a Showroom
- **Pending_Alert**: A notification indicating work items that require CA attention or action
- **Action_Recommendation**: A system-generated suggestion for the next best action a CA should take
- **Unmatched_Queue**: A list of Payment_Records that could not be automatically associated with Sale_Entries
- **Unknown_Queue**: A list of Payment_Records that arrived without any corresponding Sale_Entry
- **Confidence_Indicator**: A visual signal showing the likelihood that a Payment_Record correctly matches a Sale_Entry
- **SMS_Parser**: Component that extracts transaction details from payment notification SMS messages
- **Tally_Export**: Excel format output structured for import into Tally accounting software
- **GST_Summary**: Report showing GST collected, categorized by tax rate and transaction type
- **Quick_Mode**: Simplified sale entry requiring only amount and payment method
- **Detailed_Mode**: Complete sale entry including item details, customer information, and GST breakdown
- **Session_Mode**: Batch entry mode for recording multiple sales before matching with payments
- **Split_Payment**: A single sale paid using multiple payment methods (e.g., partial cash, partial UPI)
- **Multi_Item_Sale**: A single sale containing multiple products with potentially different GST rates
- **Invoice_PDF**: GST-compliant digital invoice generated from Sale_Entry data
- **Auto_Match_Rate**: Percentage of Payment_Records automatically matched to Sale_Entries without manual intervention
- **Showroom**: A GST-registered retail business using Rekono to record sales and manage accounting data

## Requirements

### Requirement 1: Sale Entry Creation

**User Story:** As a showroom staff member, I want to quickly record sale details at the point of sale, so that payment matching can happen accurately without slowing down customer service.

#### Acceptance Criteria

1. THE Store_Mobile_App SHALL provide Quick_Mode for entering sale amount and payment method only
2. THE Store_Mobile_App SHALL provide Detailed_Mode for entering item details, customer information, and GST breakdown
3. THE Store_Mobile_App SHALL provide Session_Mode for recording multiple sales before payment matching
4. WHEN a staff member creates a Sale_Entry, THE Store_Mobile_App SHALL timestamp the entry with the current date and time
5. WHEN a staff member creates a Sale_Entry in Detailed_Mode, THE Store_Mobile_App SHALL calculate GST amounts based on item tax rates
6. THE Store_Mobile_App SHALL complete sale entry within 10 seconds in Quick_Mode
7. WHEN a Sale_Entry is created, THE Store_Mobile_App SHALL assign a unique identifier to the entry
8. THE Store_Mobile_App SHALL support Multi_Item_Sale with different GST rates per item

### Requirement 2: SMS Payment Capture

**User Story:** As a showroom staff member, I want the system to automatically capture UPI payment notifications from my phone, so that I don't have to manually enter payment details.

#### Acceptance Criteria

1. WHEN the Store_Mobile_App is installed, THE Store_Mobile_App SHALL request SMS read permission from the user
2. WHEN an SMS arrives from PhonePe, THE SMS_Parser SHALL extract transaction amount, timestamp, sender name, and transaction ID
3. WHEN an SMS arrives from Google Pay, THE SMS_Parser SHALL extract transaction amount, timestamp, sender name, and transaction ID
4. WHEN an SMS arrives from Paytm, THE SMS_Parser SHALL extract transaction amount, timestamp, sender name, and transaction ID
5. WHEN an SMS arrives from BHIM, THE SMS_Parser SHALL extract transaction amount, timestamp, sender name, and transaction ID
6. WHEN the SMS_Parser extracts payment details, THE Store_Mobile_App SHALL create a Payment_Record with extracted data
7. IF SMS parsing fails, THEN THE Store_Mobile_App SHALL log the failure and add the SMS to a review queue
8. THE SMS_Parser SHALL process incoming payment SMS within 2 seconds of receipt

### Requirement 3: Cash Payment Entry

**User Story:** As a showroom staff member, I want to manually record cash payments, so that all payment methods are tracked in the system.

#### Acceptance Criteria

1. THE Store_Mobile_App SHALL provide a manual entry form for cash payments
2. WHEN a staff member enters a cash payment, THE Store_Mobile_App SHALL require amount and timestamp
3. WHEN a cash Payment_Record is created, THE Store_Mobile_App SHALL mark the payment method as cash
4. THE Store_Mobile_App SHALL allow staff to associate a cash Payment_Record with a Sale_Entry immediately
5. WHEN a cash payment is recorded, THE Store_Mobile_App SHALL create a Payment_Record with manual entry indicator

### Requirement 4: Payment and Sale Matching

**User Story:** As a showroom staff member, I want the system to automatically match payments with sales, so that I can confirm transactions without manual lookup.

#### Acceptance Criteria

1. WHEN a Payment_Record is created, THE Matching_Engine SHALL search for Sale_Entries with matching amounts within a 30-minute time window
2. WHEN exactly one Sale_Entry matches a Payment_Record, THE Matching_Engine SHALL automatically associate them and mark confidence as high
3. WHEN multiple Sale_Entries match a Payment_Record, THE Matching_Engine SHALL present all candidates to the user and mark confidence as medium
4. WHEN no Sale_Entry matches a Payment_Record, THE Matching_Engine SHALL add the Payment_Record to the Unknown_Queue
5. WHEN a Sale_Entry has no matching Payment_Record after 60 minutes, THE Matching_Engine SHALL add the Sale_Entry to the Unmatched_Queue
6. THE Matching_Engine SHALL calculate a Confidence_Indicator score between 0 and 100 for each match suggestion
7. WHEN a user manually confirms a match, THE Matching_Engine SHALL update the association and mark it as user-verified
8. THE Matching_Engine SHALL achieve at least 60 percent Auto_Match_Rate across all transactions
9. FOR ALL matched pairs, THE Matching_Engine SHALL preserve both Sale_Entry and Payment_Record data without modification

### Requirement 5: Split Payment Handling

**User Story:** As a showroom staff member, I want to record sales paid with multiple payment methods, so that partial cash and partial UPI transactions are accurately tracked.

#### Acceptance Criteria

1. THE Store_Mobile_App SHALL allow a Sale_Entry to be associated with multiple Payment_Records
2. WHEN a staff member indicates a Split_Payment, THE Store_Mobile_App SHALL track each payment component separately
3. WHEN all Payment_Records for a Split_Payment are matched, THE Store_Mobile_App SHALL mark the Sale_Entry as fully paid
4. WHEN Payment_Records for a Split_Payment sum to the Sale_Entry amount, THE Store_Mobile_App SHALL mark the match as complete
5. IF Payment_Records for a Split_Payment do not sum to the Sale_Entry amount, THEN THE Store_Mobile_App SHALL flag the discrepancy for review

### Requirement 6: GST-Compliant Invoice Generation

**User Story:** As a showroom staff member, I want to generate GST-compliant invoices for customers, so that I can provide proper documentation and share via WhatsApp.

#### Acceptance Criteria

1. WHEN a Sale_Entry is marked as complete, THE Store_Mobile_App SHALL generate an Invoice_PDF with all required GST fields
2. THE Invoice_PDF SHALL include showroom GSTIN, invoice number, invoice date, customer details, item descriptions, HSN codes, taxable amounts, GST rates, GST amounts, and total amount
3. THE Store_Mobile_App SHALL assign sequential invoice numbers to each Invoice_PDF
4. WHEN an Invoice_PDF is generated, THE Store_Mobile_App SHALL provide a share option for WhatsApp
5. THE Store_Mobile_App SHALL store generated Invoice_PDF files for later retrieval
6. FOR ALL Sale_Entries with valid data, generating an Invoice_PDF then parsing the PDF data SHALL produce equivalent sale information (round-trip property)

### Requirement 7: Unmatched and Unknown Queue Management

**User Story:** As a showroom staff member, I want to review and resolve unmatched payments and unknown transactions, so that all financial data is properly reconciled.

#### Acceptance Criteria

1. THE Store_Mobile_App SHALL display the Unmatched_Queue showing Sale_Entries without Payment_Records
2. THE Store_Mobile_App SHALL display the Unknown_Queue showing Payment_Records without Sale_Entries
3. WHEN a staff member views the Unmatched_Queue, THE Store_Mobile_App SHALL sort entries by age with oldest first
4. WHEN a staff member views the Unknown_Queue, THE Store_Mobile_App SHALL sort entries by age with oldest first
5. THE Store_Mobile_App SHALL allow staff to manually match items from Unmatched_Queue with items from Unknown_Queue
6. THE Store_Mobile_App SHALL allow staff to create a new Sale_Entry from an Unknown_Queue Payment_Record
7. WHEN a queue item is resolved, THE Store_Mobile_App SHALL remove it from the queue immediately

### Requirement 8: CA Operating System Home Screen

**User Story:** As a CA, I want an intelligent home screen that shows what needs my attention today, so that I can prioritize my work without manually reviewing each client.

#### Acceptance Criteria

1. WHEN a CA logs into the Web_App, THE CA_OS SHALL display a home screen with pending items requiring attention
2. THE CA_OS SHALL categorize pending items by urgency: clients pending GSTR-1 filing, clients with missing data, clients with payment issues, and clients with high-value mismatches
3. THE CA_OS SHALL display a count of pending items in each urgency category
4. THE CA_OS SHALL provide Action_Recommendations showing the next best actions for the CA to take
5. WHEN the CA selects a pending item, THE CA_OS SHALL navigate to the detailed view for that Showroom
6. THE CA_OS SHALL refresh the home screen data within 5 minutes of any transaction or status change
7. THE CA_OS SHALL sort pending items by deadline proximity with nearest deadlines first

### Requirement 9: Intelligent Task Engine

**User Story:** As a CA, I want the system to automatically generate tasks based on client data state and deadlines, so that I don't miss critical actions.

#### Acceptance Criteria

1. WHEN a GSTR-1 filing deadline approaches within 7 days, THE Task_Engine SHALL create a task to file GSTR-1 for the affected Showroom
2. WHEN a Showroom has unmatched transactions older than 48 hours, THE Task_Engine SHALL create a task to fix missing entries
3. WHEN a Showroom has a transaction mismatch exceeding ₹10,000, THE Task_Engine SHALL create a task to review the high-value mismatch
4. THE Task_Engine SHALL assign priority levels to tasks: high (deadline within 3 days), medium (deadline within 7 days), low (no immediate deadline)
5. WHEN a task is created, THE CA_OS SHALL display the task in the CA home screen and the relevant Showroom detail view
6. THE Web_App SHALL allow CAs to mark tasks as complete or dismiss tasks with a reason
7. WHEN a task is marked complete, THE Task_Engine SHALL remove it from the pending task list
8. THE Task_Engine SHALL generate tasks based on rules without requiring AI or machine learning models

### Requirement 10: Client Health Score

**User Story:** As a CA, I want to see a health score for each client, so that I can quickly identify which clients need attention.

#### Acceptance Criteria

1. THE CA_OS SHALL calculate a Client_Health_Score for each Showroom based on missing entries, unmatched payments, filing delays, and data quality
2. THE Client_Health_Score SHALL be a value between 0 and 100, where 100 indicates perfect health
3. WHEN missing entries exceed 5 percent of total transactions, THE CA_OS SHALL reduce the Client_Health_Score
4. WHEN unmatched payments exceed 10 percent of total payments, THE CA_OS SHALL reduce the Client_Health_Score
5. WHEN a filing deadline is missed, THE CA_OS SHALL reduce the Client_Health_Score by 20 points
6. THE Web_App SHALL display the Client_Health_Score on the CA dashboard next to each Showroom name
7. THE Web_App SHALL use visual indicators: green for scores above 80, yellow for scores between 50 and 80, red for scores below 50
8. WHEN a CA views a Showroom detail page, THE Web_App SHALL display the Client_Health_Score with a breakdown of contributing factors

### Requirement 11: Risk Alerts

**User Story:** As a CA, I want to receive alerts about potential compliance risks and data issues, so that I can address problems before they become critical.

#### Acceptance Criteria

1. WHEN a Showroom has a GST mismatch exceeding ₹5,000, THE CA_OS SHALL generate a Risk_Alert for high GST mismatch risk
2. WHEN a Showroom has transactions without corresponding invoices, THE CA_OS SHALL generate a Risk_Alert for unreported transactions
3. WHEN a GSTR-1 filing deadline is within 3 days and filing is incomplete, THE CA_OS SHALL generate a Risk_Alert for deadline risk
4. THE Web_App SHALL display Risk_Alerts prominently on the CA home screen with alert icons
5. WHEN a CA views a Risk_Alert, THE Web_App SHALL provide context including affected transactions and recommended actions
6. THE Web_App SHALL allow CAs to acknowledge Risk_Alerts after addressing the issue
7. THE CA_OS SHALL prioritize Risk_Alerts by severity: critical (deadline within 24 hours or mismatch over ₹50,000), high (deadline within 3 days or mismatch over ₹10,000), medium (other issues)

### Requirement 12: Smart Client Summaries

**User Story:** As a CA, I want to see a concise summary of each client's status, so that I can understand their situation at a glance without reviewing detailed transactions.

#### Acceptance Criteria

1. WHEN a CA views a Showroom detail page, THE CA_OS SHALL display a Smart_Summary at the top of the page
2. THE Smart_Summary SHALL include total sales amount for the current month
3. THE Smart_Summary SHALL include total GST collected for the current month
4. THE Smart_Summary SHALL include filing status (filed, pending filing, or overdue)
5. THE Smart_Summary SHALL include the count of unresolved issues (unmatched payments, missing entries, data errors)
6. THE Smart_Summary SHALL update within 5 minutes of any transaction or status change
7. THE Web_App SHALL allow CAs to select different time periods for the Smart_Summary (current month, last month, custom date range)

### Requirement 13: Timeline View

**User Story:** As a CA, I want to see a timeline of past events and upcoming deadlines for each client, so that I can track progress and plan ahead.

#### Acceptance Criteria

1. WHEN a CA views a Showroom detail page, THE Web_App SHALL provide a Timeline_View showing chronological events
2. THE Timeline_View SHALL display past events including data incomplete dates, review pending dates, and filing completion dates
3. THE Timeline_View SHALL display upcoming deadlines including GSTR-1 due dates and payment due dates
4. THE Timeline_View SHALL use visual markers to distinguish between completed events, current status, and future deadlines
5. WHEN a CA selects an event in the Timeline_View, THE Web_App SHALL display details about that event
6. THE Timeline_View SHALL span from 30 days in the past to 30 days in the future by default
7. THE Web_App SHALL allow CAs to expand the Timeline_View to show up to 90 days in either direction

### Requirement 14: Pending Alerts Dashboard

**User Story:** As a CA, I want to see all pending items across all my clients in one place, so that I can manage my workload efficiently.

#### Acceptance Criteria

1. THE Web_App SHALL provide a Pending_Alerts dashboard showing all pending items across all assigned Showrooms
2. THE Pending_Alerts dashboard SHALL group items by type: pending GSTR-1 filings, missing data, payment issues, and high-value mismatches
3. WHEN a CA views the Pending_Alerts dashboard, THE Web_App SHALL display the count of pending items for each Showroom
4. THE Web_App SHALL allow CAs to filter Pending_Alerts by urgency level, Showroom, or alert type
5. WHEN a CA resolves a pending item, THE CA_OS SHALL remove it from the Pending_Alerts dashboard within 1 minute
6. THE Pending_Alerts dashboard SHALL sort items by deadline with most urgent items first
7. THE Web_App SHALL display the total count of pending items across all clients at the top of the dashboard

### Requirement 15: Rules-Based Intelligence Engine

**User Story:** As a CA, I want the system to use rules-based logic to detect issues and generate recommendations, so that I receive reliable, explainable guidance without unpredictable AI behavior.

#### Acceptance Criteria

1. THE CA_OS SHALL use deterministic rules to generate all Task_Engine outputs, Risk_Alerts, and Action_Recommendations
2. WHEN unmatched transactions exceed 10 percent of total transactions, THE CA_OS SHALL generate a Pending_Alert
3. WHEN a filing deadline is within 5 days, THE CA_OS SHALL generate a Task_Engine item
4. WHEN data is incomplete for more than 3 days, THE CA_OS SHALL generate a Risk_Alert
5. THE CA_OS SHALL NOT use machine learning models or AI predictions for generating alerts or recommendations
6. WHEN a CA views a recommendation, THE Web_App SHALL display the rule logic that triggered the recommendation
7. THE CA_OS SHALL allow admin users to configure rule thresholds (percentage limits, time windows, amount thresholds)

### Requirement 16: Client List with Action Indicators

**User Story:** As a CA, I want to see which clients need attention directly in the client list, so that I can prioritize my work without opening each client individually.

#### Acceptance Criteria

1. THE Web_App SHALL display a list of all Showrooms assigned to the logged-in CA
2. WHEN a CA views the client list, THE Web_App SHALL display the Client_Health_Score next to each Showroom name
3. THE Web_App SHALL display visual indicators for pending actions: filing due, data issues, payment problems, or review needed
4. THE Web_App SHALL show the count of pending tasks for each Showroom in the client list
5. WHEN a CA selects a Showroom, THE Web_App SHALL navigate to the CA OS detail view for that Showroom
6. THE Web_App SHALL allow CAs to filter the client list by health score, pending alert type, or deadline proximity
7. THE Web_App SHALL sort the client list by urgency with clients requiring immediate attention first

### Requirement 17: Action Recommendation Engine

**User Story:** As a CA, I want the system to recommend specific next actions based on client status, so that I can work efficiently without analyzing each client manually.

#### Acceptance Criteria

1. WHEN a CA views the home screen, THE CA_OS SHALL display up to 5 Action_Recommendations prioritized by urgency
2. THE CA_OS SHALL generate Action_Recommendations based on rules: review clients with health score below 70, follow up on clients with missing data over 3 days old, file returns for clients with deadlines within 5 days
3. WHEN a CA selects an Action_Recommendation, THE Web_App SHALL navigate to the relevant Showroom detail page
4. THE Action_Recommendation SHALL include the client name, the recommended action, and the reason for the recommendation
5. WHEN a CA completes a recommended action, THE CA_OS SHALL remove the Action_Recommendation from the home screen
6. THE CA_OS SHALL refresh Action_Recommendations every 10 minutes based on current data state
7. THE CA_OS SHALL use only rules-based logic for generating Action_Recommendations without AI predictions

### Requirement 18: Deadline Tracking

**User Story:** As a CA, I want to track upcoming GST filing deadlines for all my clients, so that I never miss a compliance deadline.

#### Acceptance Criteria

1. THE CA_OS SHALL maintain a calendar of GSTR-1 filing deadlines for each Showroom
2. WHEN a filing deadline is within 7 days, THE CA_OS SHALL display the deadline on the CA home screen
3. WHEN a filing deadline is within 3 days, THE CA_OS SHALL generate a high-priority Task_Engine item
4. THE Web_App SHALL display upcoming deadlines in the Timeline_View for each Showroom
5. WHEN a CA marks a filing as complete, THE CA_OS SHALL update the deadline status and remove it from pending alerts
6. THE CA_OS SHALL calculate the next filing deadline automatically based on GST filing frequency rules
7. THE Web_App SHALL provide a consolidated deadline calendar view showing all client deadlines in chronological order

### Requirement 19: Transaction Review and Filtering

**User Story:** As an accountant, I want to review and filter transactions by date, amount, status, and payment method, so that I can efficiently clean up data before export.

#### Acceptance Criteria

1. THE Web_App SHALL display all Sale_Entries and Payment_Records for a selected Showroom
2. THE Web_App SHALL provide filters for date range, amount range, match status, payment method, and GST rate
3. WHEN an accountant applies filters, THE Web_App SHALL update the transaction list within 2 seconds
4. THE Web_App SHALL allow sorting by date, amount, or match confidence
5. WHEN an accountant selects a transaction, THE Web_App SHALL display full details including Sale_Entry, Payment_Record, and match confidence
6. THE Web_App SHALL highlight transactions with low Confidence_Indicator scores
7. THE Web_App SHALL allow accountants to manually adjust matches and add notes

### Requirement 20: Tally Export

**User Story:** As an accountant, I want to export transaction data in Tally-ready Excel format, so that I can import it into the accounting system without manual reformatting.

#### Acceptance Criteria

1. THE Web_App SHALL provide an export function that generates a Tally_Export file
2. THE Tally_Export SHALL include columns for date, voucher type, ledger name, amount, GST rate, CGST, SGST, IGST, and narration
3. WHEN an accountant requests a Tally_Export, THE Web_App SHALL include only matched and verified transactions
4. THE Web_App SHALL allow accountants to select a date range for the Tally_Export
5. WHEN the Tally_Export is generated, THE Web_App SHALL download the file in Excel format
6. THE Tally_Export SHALL group transactions by date and voucher type
7. FOR ALL exported transactions, importing the Tally_Export into Tally then exporting from Tally SHALL produce equivalent financial totals (round-trip property)

### Requirement 21: GST Summary Report

**User Story:** As a CA, I want to view GST collected by tax rate and transaction type, so that I can verify GST compliance before filing returns.

#### Acceptance Criteria

1. THE Web_App SHALL generate a GST_Summary showing total GST collected by rate (0%, 5%, 12%, 18%, 28%)
2. THE GST_Summary SHALL separate CGST, SGST, and IGST amounts
3. WHEN a CA requests a GST_Summary, THE Web_App SHALL allow selection of a date range
4. THE GST_Summary SHALL include taxable amount, tax amount, and total amount for each GST rate
5. THE Web_App SHALL provide an export option for the GST_Summary in Excel format
6. THE GST_Summary SHALL match the sum of individual transaction GST amounts within 1 rupee tolerance

### Requirement 22: Accountant Marketplace Assignment

**User Story:** As a showroom owner, I want to request help from a freelance accountant, so that I can get data cleanup assistance without hiring full-time staff.

#### Acceptance Criteria

1. THE Store_Mobile_App SHALL provide a help request button for showroom users
2. WHEN a showroom user requests help, THE Store_Mobile_App SHALL send the request to the admin system
3. THE Web_App SHALL allow admin users to view pending help requests
4. THE Web_App SHALL allow admin users to assign a help request to an available Accountant
5. WHEN an Accountant is assigned, THE Web_App SHALL grant the Accountant access to the Showroom data
6. THE Web_App SHALL restrict Accountant users from accessing GST filing functions
7. WHEN an Accountant completes work, THE Web_App SHALL allow the Accountant to mark the request as complete

### Requirement 23: User Authentication and Authorization

**User Story:** As a system administrator, I want to control access based on user roles, so that showroom staff, accountants, and CAs only see appropriate data and functions.

#### Acceptance Criteria

1. THE Store_Mobile_App SHALL require username and password authentication for access
2. THE Web_App SHALL require username and password authentication for access
3. WHEN a user logs in, THE system SHALL verify credentials against stored user records
4. THE system SHALL assign one of four roles to each user: showroom staff, accountant, CA, or admin
5. WHEN a showroom staff user logs in, THE Store_Mobile_App SHALL restrict access to only their assigned Showroom data
6. WHEN an Accountant logs in, THE Web_App SHALL restrict access to only assigned Showroom clients
7. WHEN a CA logs in, THE Web_App SHALL grant access to all assigned Showroom clients and CA_OS features
8. WHEN an admin logs in, THE Web_App SHALL grant access to all system functions including user management and marketplace assignment
9. IF authentication fails three times, THEN THE system SHALL lock the account for 15 minutes

### Requirement 24: Data Persistence and Backup

**User Story:** As a showroom owner, I want my sales and payment data to be safely stored and backed up, so that I don't lose critical business information.

#### Acceptance Criteria

1. WHEN a Sale_Entry is created, THE system SHALL persist the data to the database within 5 seconds
2. WHEN a Payment_Record is created, THE system SHALL persist the data to the database within 5 seconds
3. WHEN a match is confirmed, THE system SHALL persist the association to the database within 5 seconds
4. THE system SHALL perform automated database backups every 24 hours
5. THE system SHALL retain transaction data for at least 7 years to comply with GST record-keeping requirements
6. IF database write fails, THEN THE system SHALL retry the operation up to 3 times before alerting the user

### Requirement 25: Mobile App Offline Support

**User Story:** As a showroom staff member, I want to record sales even when internet connectivity is poor, so that customer service is not interrupted by network issues.

#### Acceptance Criteria

1. WHEN the Store_Mobile_App detects no internet connection, THE Store_Mobile_App SHALL store Sale_Entries locally on the device
2. WHEN the Store_Mobile_App detects no internet connection, THE Store_Mobile_App SHALL store Payment_Records locally on the device
3. WHEN internet connection is restored, THE Store_Mobile_App SHALL synchronize locally stored data to the server within 30 seconds
4. THE Store_Mobile_App SHALL indicate offline mode status to the user with a visual indicator
5. WHEN synchronization completes, THE Store_Mobile_App SHALL notify the user of successful sync
6. IF synchronization fails, THEN THE Store_Mobile_App SHALL retry every 5 minutes until successful

### Requirement 26: System Performance

**User Story:** As a showroom staff member, I want the app to respond quickly during busy sales periods, so that I can serve customers efficiently.

#### Acceptance Criteria

1. WHEN a user interacts with the Store_Mobile_App, THE Store_Mobile_App SHALL respond to touch inputs within 200 milliseconds
2. WHEN a user loads the transaction list in the Web_App, THE Web_App SHALL display results within 3 seconds for up to 10,000 transactions
3. WHEN the Matching_Engine processes a Payment_Record, THE Matching_Engine SHALL complete matching logic within 5 seconds
4. THE system SHALL support at least 50 concurrent users across all Showrooms without performance degradation
5. WHEN generating an Invoice_PDF, THE Store_Mobile_App SHALL complete generation within 3 seconds
6. WHEN the CA_OS calculates Client_Health_Score for all clients, THE CA_OS SHALL complete calculation within 10 seconds

### Requirement 27: Error Handling and Logging

**User Story:** As a system administrator, I want detailed error logs and user-friendly error messages, so that I can troubleshoot issues and users understand what went wrong.

#### Acceptance Criteria

1. WHEN an error occurs in the Store_Mobile_App, THE Store_Mobile_App SHALL display a user-friendly error message
2. WHEN an error occurs in the Web_App, THE Web_App SHALL display a user-friendly error message
3. WHEN an error occurs, THE system SHALL log the error details including timestamp, user ID, operation attempted, and error message
4. THE system SHALL store error logs for at least 90 days
5. WHEN a critical error occurs, THE system SHALL send an alert notification to admin users
6. IF SMS_Parser fails to parse a payment SMS, THEN THE system SHALL log the raw SMS content for manual review

### Requirement 28: Data Validation

**User Story:** As an accountant, I want the system to validate data entry, so that incorrect or incomplete information is caught before it affects reports.

#### Acceptance Criteria

1. WHEN a user enters a Sale_Entry amount, THE Store_Mobile_App SHALL verify the amount is greater than zero
2. WHEN a user enters GST rates, THE Store_Mobile_App SHALL verify rates are valid GST percentages (0%, 5%, 12%, 18%, 28%)
3. WHEN a user enters a GSTIN, THE system SHALL verify the format matches the 15-character GST identification number pattern
4. WHEN a user enters a mobile number, THE system SHALL verify the format is a valid 10-digit Indian mobile number
5. IF validation fails, THEN THE system SHALL display a specific error message indicating which field is invalid
6. THE system SHALL prevent saving of Sale_Entries or Payment_Records with invalid data

### Requirement 29: Multi-Payment Method Support

**User Story:** As a showroom staff member, I want to track different UPI providers and bank transfers separately, so that reconciliation with bank statements is easier.

#### Acceptance Criteria

1. THE Store_Mobile_App SHALL categorize Payment_Records by payment method: PhonePe, Google Pay, Paytm, BHIM, bank transfer, or cash
2. WHEN generating reports, THE Web_App SHALL allow filtering by specific payment method
3. THE Tally_Export SHALL include payment method information for each transaction
4. THE Web_App SHALL display payment method distribution statistics on the dashboard
5. WHEN a Payment_Record is created from SMS, THE SMS_Parser SHALL identify and tag the payment provider

### Requirement 30: Daily Usage and Retention

**User Story:** As a product manager, I want to track daily active users and 30-day retention, so that I can measure product adoption and engagement.

#### Acceptance Criteria

1. WHEN a user opens the Store_Mobile_App, THE system SHALL record a daily active user event with user ID and timestamp
2. WHEN a user opens the Web_App, THE system SHALL record a daily active user event with user ID and timestamp
3. THE system SHALL calculate 30-day retention rate as the percentage of users who return after 30 days from first use
4. THE system SHALL provide an admin dashboard showing daily active users, Auto_Match_Rate, and 30-day retention metrics
5. THE system SHALL track the number of Sale_Entries created per Showroom per day
6. THE system SHALL track the number of CA referrals resulting in new Showroom signups
7. THE system SHALL track CA engagement metrics including logins per week and average time spent in CA_OS features
