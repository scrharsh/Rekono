# Implementation Plan: Rekono Migration to NestJS and Next.js

## Overview

This implementation plan breaks down the migration of Rekono MVP from Express/React to NestJS/Next.js into actionable coding tasks. The migration follows three sequential phases: Backend Migration (Express → NestJS), Web Frontend Migration (React/Vite → Next.js), and Integration & Optimization. Each task references specific requirements and includes testing sub-tasks to ensure correctness throughout the migration process.

The plan maintains zero downtime through Blue-Green deployment, preserves all 52 existing correctness properties, and ensures 100% API compatibility for the React Native mobile app.

## Tasks

### Phase 1: Backend Migration (Express → NestJS) ✅ COMPLETED

- [x] 1. Set up NestJS project structure and configuration
  - [x] 1.1 Initialize NestJS project with CLI
    - Create new backend-nestjs directory
    - Run `nest new backend-nestjs` with TypeScript strict mode
    - Configure tsconfig.json with strict type checking
    - _Requirements: 5.1, 21.1, 22.1_

  - [x] 1.2 Configure database connection module
    - Create DatabaseModule with MongooseModule.forRootAsync
    - Implement connection retry logic with exponential backoff
    - Add connection event logging (connected, error, disconnected)
    - Use same MONGODB_URI as Current_Backend
    - _Requirements: 4.1, 4.2, 19.1, 19.2, 19.3_

  - [x] 1.3 Set up environment configuration
    - Install and configure @nestjs/config
    - Create ConfigModule with validation schema
    - Define all required environment variables in .env.example
    - Implement startup validation for required config
    - _Requirements: 20.1, 20.2, 20.3, 20.6_


  - [x] 1.4 Configure logging and monitoring infrastructure
    - Set up NestJS Logger with Winston integration
    - Configure log levels for different environments
    - Implement structured logging format
    - Add health check endpoints (/health, /health/db)
    - _Requirements: 18.1, 18.2, 19.7_

  - [ ]* 1.5 Set up testing infrastructure
    - Configure Jest for unit and integration tests
    - Set up test database configuration
    - Create test utilities and mocks
    - Configure code coverage reporting (target 80%)
    - _Requirements: 8.1, 8.4, 25.1_

- [x] 2. Migrate Mongoose schemas and models
  - [x] 2.1 Create NestJS schema definitions
    - Migrate User.model.ts to @nestjs/mongoose schema
    - Migrate Showroom.model.ts to @nestjs/mongoose schema
    - Migrate SaleEntry.model.ts to @nestjs/mongoose schema
    - Migrate PaymentRecord.model.ts to @nestjs/mongoose schema
    - Migrate Match.model.ts to @nestjs/mongoose schema
    - Migrate HelpRequest.model.ts to @nestjs/mongoose schema
    - Ensure identical field names, types, and indexes
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.2 Write property tests for schema compatibility
    - Test that NestJS schemas produce identical MongoDB documents
    - Test that data written by Current_Backend is readable by Target_Backend
    - Test that data written by Target_Backend is readable by Current_Backend
    - _Requirements: 4.4, 4.5, 4.6, 24.1_

- [x] 3. Implement authentication module
  - [x] 3.1 Create AuthModule with JWT strategy
    - Create AuthModule, AuthService, AuthController
    - Configure JwtModule with same secret as Current_Backend
    - Implement JwtStrategy with PassportStrategy
    - Use same JWT payload structure (sub, email, role, iat, exp)
    - Use same token expiration (7 days)
    - _Requirements: 3.1, 3.5, 13.1, 13.2, 13.5_

  - [x] 3.2 Implement authentication endpoints
    - POST /v1/auth/register with RegisterDto validation
    - POST /v1/auth/login with LoginDto validation
    - GET /v1/auth/me with JWT guard
    - Use bcrypt with same salt rounds as Current_Backend
    - _Requirements: 3.1, 3.2, 3.3, 13.6_

  - [x] 3.3 Create JWT authentication guard
    - Implement JwtAuthGuard extending AuthGuard('jwt')
    - Create RolesGuard for role-based authorization
    - Create @Roles decorator for controller methods
    - _Requirements: 5.4, 6.1_

  - [ ]* 3.4 Write unit tests for AuthService
    - Test JWT token generation and validation
    - Test password hashing and comparison
    - Test user registration and login flows
    - _Requirements: 8.1, 25.1_

  - [ ]* 3.5 Write property tests for authentication
    - Test JWT token compatibility between backends
    - Test that tokens issued by Current_Backend are valid in Target_Backend
    - Test password hash compatibility
    - _Requirements: 13.1, 13.7, 24.2_

- [x] 4. Implement common middleware and guards
  - [x] 4.1 Create global validation pipe
    - Configure ValidationPipe with class-validator
    - Enable whitelist and forbidNonWhitelisted options
    - Implement transform option for type coercion
    - _Requirements: 5.6, 6.3_

  - [x] 4.2 Implement rate limiting
    - Install and configure @nestjs/throttler
    - Set same rate limits as Current_Backend
    - Apply ThrottlerGuard globally
    - _Requirements: 3.6, 6.2_

  - [x] 4.3 Create exception filters
    - Implement global exception filter
    - Map exceptions to same HTTP status codes as Current_Backend
    - Format error responses identically to Current_Backend
    - _Requirements: 3.4, 6.4_

  - [x] 4.4 Configure security middleware
    - Install and configure @nestjs/helmet
    - Configure CORS with same origins as Current_Backend
    - Implement request sanitization
    - _Requirements: 6.5, 6.6, 6.7_

  - [x] 4.5 Create logging interceptor
    - Implement LoggingInterceptor for request/response logging
    - Log request method, URL, status code, and duration
    - Track response times for monitoring
    - _Requirements: 5.5, 18.3_

  - [ ]* 4.6 Write integration tests for middleware pipeline
    - Test authentication guard behavior
    - Test rate limiting enforcement
    - Test validation pipe error handling
    - Test exception filter responses
    - _Requirements: 6.8, 8.2, 25.2_

- [x] 5. Checkpoint - Verify core infrastructure
  - Ensure all tests pass, ask the user if questions arise.


- [x] 6. Implement Sales module
  - [x] 6.1 Create SalesModule structure
    - Create SalesModule, SalesController, SalesService
    - Register SaleEntry schema with MongooseModule.forFeature
    - Inject SaleEntry model into SalesService
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 6.2 Create DTOs for sales endpoints
    - CreateSaleDto with validation decorators
    - UpdateSaleDto with partial validation
    - PaginationDto for query parameters
    - Ensure DTOs match Current_Backend request formats
    - _Requirements: 3.2, 5.3, 21.3_

  - [x] 6.3 Implement sales endpoints
    - POST /v1/showrooms/:showroomId/sales
    - GET /v1/showrooms/:showroomId/sales (with pagination)
    - GET /v1/showrooms/:showroomId/sales/:saleId
    - PUT /v1/showrooms/:showroomId/sales/:saleId
    - DELETE /v1/showrooms/:showroomId/sales/:saleId
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [x] 6.4 Migrate SMS parser service
    - Create SmsParserService with identical parsing logic
    - Preserve all regex patterns and extraction rules
    - Maintain same error handling behavior
    - _Requirements: 7.2, 7.8_

  - [ ]* 6.5 Write unit tests for SalesService
    - Test CRUD operations
    - Test SMS parsing logic
    - Test error handling
    - _Requirements: 8.1, 25.1_

  - [ ]* 6.6 Write property tests for SMS parsing
    - Test round-trip property: parse → format → parse
    - Test that parsing results match Current_Backend
    - _Requirements: 24.3, 24.8_

  - [ ]* 6.7 Write integration tests for sales endpoints
    - Test all CRUD endpoints with authentication
    - Test pagination and filtering
    - Test error responses
    - _Requirements: 8.2, 25.2_

- [x] 7. Implement Payments module
  - [x] 7.1 Create PaymentsModule structure
    - Create PaymentsModule, PaymentsController, PaymentsService
    - Register PaymentRecord schema with MongooseModule.forFeature
    - Inject PaymentRecord model into PaymentsService
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 7.2 Create DTOs for payment endpoints
    - CreatePaymentDto with validation decorators
    - Ensure DTOs match Current_Backend request formats
    - _Requirements: 3.2, 5.3, 21.3_

  - [x] 7.3 Implement payment endpoints
    - POST /v1/showrooms/:showroomId/payments
    - GET /v1/showrooms/:showroomId/payments (with pagination)
    - GET /v1/showrooms/:showroomId/payments/:paymentId
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 7.4 Write unit tests for PaymentsService
    - Test payment creation and retrieval
    - Test validation logic
    - _Requirements: 8.1, 25.1_

  - [ ]* 7.5 Write integration tests for payment endpoints
    - Test all endpoints with authentication
    - Test error responses
    - _Requirements: 8.2, 25.2_

- [x] 8. Implement Matching module
  - [x] 8.1 Create MatchingModule structure
    - Create MatchingModule, MatchingController, MatchingService
    - Register Match schema with MongooseModule.forFeature
    - Inject dependencies (SaleEntry, PaymentRecord, Match models)
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 8.2 Migrate matching algorithm
    - Create MatchingService with identical matching logic
    - Preserve fuzzy matching rules for customer names
    - Preserve amount tolerance logic
    - Preserve timestamp proximity logic
    - _Requirements: 7.3, 7.8_

  - [x] 8.3 Create DTOs for matching endpoints
    - CreateMatchDto with validation decorators
    - Ensure DTOs match Current_Backend request formats
    - _Requirements: 3.2, 5.3, 21.3_

  - [x] 8.4 Implement matching endpoints
    - POST /v1/showrooms/:showroomId/match
    - GET /v1/showrooms/:showroomId/matches
    - DELETE /v1/showrooms/:showroomId/matches/:matchId
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 8.5 Write unit tests for MatchingService
    - Test matching algorithm with various scenarios
    - Test fuzzy name matching
    - Test amount tolerance
    - _Requirements: 8.1, 25.1_

  - [ ]* 8.6 Write property tests for matching engine
    - Test that matched pairs preserve amounts (within tolerance)
    - Test that matching is deterministic for same inputs
    - Test that matching results match Current_Backend
    - _Requirements: 24.6, 24.8_

  - [ ]* 8.7 Write integration tests for matching endpoints
    - Test match creation and deletion
    - Test queue retrieval
    - _Requirements: 8.2, 25.2_

- [x] 9. Implement Queues module
  - [x] 9.1 Create QueuesModule structure
    - Create QueuesModule, QueuesController, QueuesService
    - Inject dependencies (SaleEntry, PaymentRecord, Match models)
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 9.2 Implement queue endpoints
    - GET /v1/showrooms/:showroomId/queues/unknown
    - GET /v1/showrooms/:showroomId/queues/unma
- [ ] 6. Implement Sales module
  - [ ] 6.1 Create SalesModule structure
    - Create SalesModule, SalesController, SalesService
    - Register SaleEntry schema with MongooseModule.forFeature
    - Inject SaleEntry model into SalesService
    - _Requirements: 5.1, 5.2, 22.2_

  - [ ] 6.2 Create DTOs for sales endpoints
    - CreateSaleDto with validation decorators
    - UpdateSaleDto with partial validation
    - PaginationDto for query parameters
    - Ensure DTOs match Current_Backend request formats
    - _Requirements: 3.2, 5.3, 21.3_

  - [ ] 6.3 Implement sales endpoints
    - POST /v1/showrooms/:showroomId/sales
    - GET /v1/showrooms/:showroomId/sales (with pagination)
    - GET /v1/showrooms/:showroomId/sales/:saleId
    - PUT /v1/showrooms/:showroomId/sales/:saleId
    - DELETE /v1/showrooms/:showroomId/sales/:saleId
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ] 6.4 Migrate SMS parser service
    - Create SmsParserService with identical parsing logic
    - Preserve all regex patterns and extraction rules
    - Maintain same error handling behavior
    - _Requirements: 7.2, 7.8_

  - [ ]* 6.5 Write unit tests for SalesService
    - Test CRUD operations
    - Test SMS parsing logic
    - Test error handling
    - _Requirements: 8.1, 25.1_

  - [ ]* 6.6 Write property tests for SMS parsing
    - Test round-trip property: parse then format then parse
    - Test that parsing results match Current_Backend
    - _Requirements: 24.3, 24.8_

  - [ ]* 6.7 Write integration tests for sales endpoints
    - Test all CRUD endpoints with authentication
    - Test pagination and filtering
    - Test error responses
    - _Requirements: 8.2, 25.2_


- [ ] 7. Implement Payments module
  - [ ] 7.1 Create PaymentsModule structure
    - Create PaymentsModule, PaymentsController, PaymentsService
    - Register PaymentRecord schema with MongooseModule.forFeature
    - Inject PaymentRecord model into PaymentsService
    - _Requirements: 5.1, 5.2, 22.2_

  - [ ] 7.2 Create DTOs for payment endpoints
    - CreatePaymentDto with validation decorators
    - Ensure DTOs match Current_Backend request formats
    - _Requirements: 3.2, 5.3, 21.3_

  - [ ] 7.3 Implement payment endpoints
    - POST /v1/showrooms/:showroomId/payments
    - GET /v1/showrooms/:showroomId/payments (with pagination)
    - GET /v1/showrooms/:showroomId/payments/:paymentId
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 7.4 Write unit tests for PaymentsService
    - Test payment creation and retrieval
    - Test validation logic
    - _Requirements: 8.1, 25.1_

  - [ ]* 7.5 Write integration tests for payment endpoints
    - Test all endpoints with authentication
    - Test error responses
    - _Requirements: 8.2, 25.2_

- [ ] 8. Implement Matching module
  - [ ] 8.1 Create MatchingModule structure
    - Create MatchingModule, MatchingController, MatchingService
    - Register Match schema with MongooseModule.forFeature
    - Inject dependencies (SaleEntry, PaymentRecord, Match models)
    - _Requirements: 5.1, 5.2, 22.2_

  - [ ] 8.2 Migrate matching algorithm
    - Create MatchingService with identical matching logic
    - Preserve fuzzy matching rules for customer names
    - Preserve amount tolerance logic
    - Preserve timestamp proximity logic
    - _Requirements: 7.3, 7.8_

  - [ ] 8.3 Create DTOs for matching endpoints
    - CreateMatchDto with validation decorators
    - Ensure DTOs match Current_Backend request formats
    - _Requirements: 3.2, 5.3, 21.3_

  - [ ] 8.4 Implement matching endpoints
    - POST /v1/showrooms/:showroomId/match
    - GET /v1/showrooms/:showroomId/matches
    - DELETE /v1/showrooms/:showroomId/matches/:matchId
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 8.5 Write unit tests for MatchingService
    - Test matching algorithm with various scenarios
    - Test fuzzy name matching
    - Test amount tolerance
    - _Requirements: 8.1, 25.1_

  - [ ]* 8.6 Write property tests for matching engine
    - Test that matched pairs preserve amounts (within tolerance)
    - Test that matching is deterministic for same inputs
    - Test that matching results match Current_Backend
    - _Requirements: 24.6, 24.8_

  - [ ]* 8.7 Write integration tests for matching endpoints
    - Test match creation and deletion
    - Test queue retrieval
    - _Requirements: 8.2, 25.2_


- [ ] 9. Implement Queues module
  - [ ] 9.1 Create QueuesModule structure
    - Create QueuesModule, QueuesController, QueuesService
    - Inject dependencies (SaleEntry, PaymentRecord, Match models)
    - _Requirements: 5.1, 5.2, 22.2_

  - [ ] 9.2 Implement queue endpoints
    - GET /v1/showrooms/:showroomId/queues/unknown
    - GET /v1/showrooms/:showroomId/queues/unmatched
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 9.3 Write property tests for queue operations
    - Test idempotence: processing queue twice equals processing once
    - Test that queue results match Current_Backend
    - _Requirements: 24.7, 24.8_

  - [ ]* 9.4 Write integration tests for queue endpoints
    - Test unknown queue retrieval
    - Test unmatched queue retrieval
    - _Requirements: 8.2, 25.2_

- [x] 10. Implement Invoices module
  - [x] 10.1 Create InvoicesModule structure
    - Create InvoicesModule, InvoicesController, InvoicesService
    - Inject dependencies for PDF generation
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 10.2 Migrate invoice generation service
    - Create InvoiceService with identical PDF generation logic
    - Preserve PDF template and formatting
    - Maintain same invoice numbering logic
    - _Requirements: 7.4, 7.8_

  - [x] 10.3 Create DTOs for invoice endpoints
    - CreateInvoiceDto with validation decorators
    - Ensure DTOs match Current_Backend request formats
    - _Requirements: 3.2, 5.3, 21.3_

  - [x] 10.4 Implement invoice endpoints
    - POST /v1/showrooms/:showroomId/invoices
    - GET /v1/showrooms/:showroomId/invoices
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 10.5 Write unit tests for InvoiceService
    - Test invoice generation logic
    - Test PDF formatting
    - _Requirements: 8.1, 25.1_

  - [ ]* 10.6 Write property tests for invoice generation
    - Test round-trip: generate then parse then generate
    - Test that invoices match Current_Backend format
    - _Requirements: 24.4, 24.8_

  - [ ]* 10.7 Write integration tests for invoice endpoints
    - Test invoice creation and retrieval
    - Test PDF download
    - _Requirements: 8.2, 25.2_

- [x] 11. Implement Exports module
  - [x] 11.1 Create ExportsModule structure
    - Create ExportsModule, ExportsController, ExportsService
    - Inject dependencies for Excel and Tally export
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 11.2 Migrate export service
    - Create ExportService with identical Tally XML generation
    - Preserve Excel formatting and structure
    - Maintain same export logic
    - _Requirements: 7.5, 7.8_

  - [x] 11.3 Implement export endpoints
    - POST /v1/showrooms/:showroomId/export/tally
    - POST /v1/showrooms/:showroomId/export/excel
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 11.4 Write unit tests for ExportService
    - Test Tally XML generation
    - Test Excel generation
    - _Requirements: 8.1, 25.1_

  - [ ]* 11.5 Write property tests for Tally export
    - Test round-trip: export then import then export
    - Test that exports match Current_Backend format
    - _Requirements: 24.5, 24.8_

  - [ ]* 11.6 Write integration tests for export endpoints
    - Test Tally export generation
    - Test Excel export generation
    - _Requirements: 8.2, 25.2_


- [x] 12. Implement CA OS module
  - [x] 12.1 Create CAOSModule structure
    - Create CAOSModule, CAOSController, CAOSService
    - Inject dependencies for analytics and health scoring
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 12.2 Migrate CA OS service
    - Create CaosService with identical health score calculation
    - Preserve alert generation logic
    - Maintain timeline aggregation logic
    - _Requirements: 7.6, 7.8_

  - [x] 12.3 Implement CA OS endpoints
    - GET /v1/ca-os/timeline
    - GET /v1/ca-os/alerts
    - GET /v1/ca-os/summary
    - Apply JwtAuthGuard with CA role check
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 12.4 Write unit tests for CaosService
    - Test health score calculation
    - Test alert generation
    - Test timeline aggregation
    - _Requirements: 8.1, 25.1_

  - [ ]* 12.5 Write integration tests for CA OS endpoints
    - Test all CA OS endpoints
    - Test role-based access
    - _Requirements: 8.2, 25.2_

- [x] 13. Implement Dashboard and Analytics modules
  - [x] 13.1 Create DashboardModule structure
    - Create DashboardModule, DashboardController, DashboardService
    - Inject dependencies for data aggregation
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 13.2 Create AnalyticsModule structure
    - Create AnalyticsModule, AnalyticsController, AnalyticsService
    - Inject dependencies for metric calculations
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 13.3 Migrate analytics service
    - Create AnalyticsService with identical metric calculations
    - Preserve aggregation logic
    - Maintain same calculation formulas
    - _Requirements: 7.7, 7.8_

  - [x] 13.4 Implement dashboard and analytics endpoints
    - GET /v1/dashboard
    - GET /v1/analytics/showroom/:showroomId
    - Apply JwtAuthGuard and RolesGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 13.5 Write unit tests for analytics
    - Test metric calculations
    - Test data aggregation
    - _Requirements: 8.1, 25.1_

  - [ ]* 13.6 Write integration tests for dashboard endpoints
    - Test dashboard data retrieval
    - Test analytics endpoints
    - _Requirements: 8.2, 25.2_

- [x] 14. Implement Help Requests module
  - [x] 14.1 Create HelpRequestsModule structure
    - Create HelpRequestsModule, HelpRequestsController, HelpRequestsService
    - Register HelpRequest schema with MongooseModule.forFeature
    - _Requirements: 5.1, 5.2, 22.2_

  - [x] 14.2 Create DTOs for help request endpoints
    - CreateHelpRequestDto with validation decorators
    - Ensure DTOs match Current_Backend request formats
    - _Requirements: 3.2, 5.3, 21.3_

  - [x] 14.3 Implement help request endpoints
    - POST /v1/help-requests
    - GET /v1/help-requests
    - Apply JwtAuthGuard
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 14.4 Write unit tests for HelpRequestsService
    - Test help request creation and retrieval
    - _Requirements: 8.1, 25.1_

  - [ ]* 14.5 Write integration tests for help request endpoints
    - Test all endpoints with authentication
    - _Requirements: 8.2, 25.2_

- [x] 15. Checkpoint - Verify all modules implemented
  - Ensure all tests pass, ask the user if questions arise.


- [x] 16. Configure OpenAPI documentation
  - [x] 16.1 Set up Swagger module
    - Install @nestjs/swagger
    - Configure SwaggerModule in main.ts
    - Add API metadata and descriptions
    - _Requirements: 5.7, 23.4_

  - [x] 16.2 Add API decorators to controllers
    - Add @ApiTags to all controllers
    - Add @ApiOperation to all endpoints
    - Add @ApiResponse decorators for status codes
    - Add @ApiProperty to all DTOs
    - _Requirements: 5.7, 23.4_

- [ ] 17. Implement end-to-end tests
  - [ ]* 17.1 Create E2E test suite
    - Set up E2E testing infrastructure
    - Create test database seeding utilities
    - _Requirements: 8.3, 25.3_

  - [ ]* 17.2 Write E2E tests for critical flows
    - Test user registration and login flow
    - Test sale entry creation and matching flow
    - Test invoice generation flow
    - Test export generation flow
    - _Requirements: 8.3, 25.3_

  - [ ]* 17.3 Write mobile app compatibility tests
    - Test all mobile API endpoints
    - Verify request/response formats match Current_Backend
    - Test JWT token compatibility
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 25.5_

- [-] 18. Set up deployment configuration
  - [ ] 18.1 Configure Railway/Render deployment
    - Create railway.json or render.yaml
    - Configure environment variables
    - Set up health check endpoints
    - Configure auto-scaling settings
    - _Requirements: 17.2, 17.6, 28.2_

  - [ ] 18.2 Set up CI/CD pipeline for backend
    - Create GitHub Actions workflow
    - Add build and test steps
    - Add deployment step to Railway/Render
    - Configure staging and production environments
    - _Requirements: 17.1, 17.2, 17.3, 17.7_

  - [ ] 18.3 Implement smoke tests
    - Create smoke test script for health checks
    - Test critical API endpoints
    - Verify database connectivity
    - _Requirements: 8.7, 17.4_

  - [ ] 18.4 Configure monitoring and alerting
    - Set up error tracking (Sentry or similar)
    - Configure response time monitoring
    - Set up alerts for error rates > 1%
    - Set up alerts for response times > 500ms
    - _Requirements: 18.4, 18.5, 18.6, 18.7_

- [ ] 19. Implement Blue-Green deployment strategy
  - [ ] 19.1 Deploy Target_Backend to staging
    - Deploy NestJS backend to staging environment
    - Run smoke tests against staging
    - Verify database connectivity
    - _Requirements: 2.3, 17.4_

  - [ ] 19.2 Configure traffic routing
    - Set up load balancer or reverse proxy
    - Configure 10% traffic to Target_Backend initially
    - Implement traffic monitoring
    - _Requirements: 2.3, 26.1, 26.2_

  - [ ] 19.3 Implement gradual rollout
    - Monitor error rates and response times
    - Increase traffic by 20% every 2 hours if stable
    - Implement automatic rollback on error rate > 1%
    - _Requirements: 26.2, 26.3, 26.4, 26.7_

  - [ ] 19.4 Document rollback procedure
    - Create rollback runbook
    - Test rollback in staging
    - Verify data compatibility after rollback
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.7_

- [ ] 20. Performance testing and optimization
  - [ ]* 20.1 Establish performance baselines
    - Measure Current_Backend response times
    - Measure Current_Backend throughput
    - Document baseline metrics
    - _Requirements: 15.7_

  - [ ]* 20.2 Run load tests against Target_Backend
    - Test with expected concurrent users
    - Measure response times under load
    - Verify 95th percentile < 200ms
    - _Requirements: 15.3, 15.5, 25.4_

  - [ ]* 20.3 Verify performance improvements
    - Compare Target_Backend vs Current_Backend response times
    - Verify 30% improvement in average response time
    - Verify 50% improvement in concurrent request handling
    - _Requirements: 15.1, 15.3_

- [ ] 21. Final Phase 1 checkpoint
  - Ensure all tests pass, verify Target_Backend serves 100% traffic for 24 hours, ask the user if questions arise.


### Phase 2: Web Frontend Migration (React/Vite → Next.js)

- [ ] 22. Set up Next.js project structure
  - [ ] 22.1 Initialize Next.js project
    - Create new web-nextjs directory
    - Run `npx create-next-app@latest` with App Router
    - Configure TypeScript with strict mode
    - Set up Tailwind CSS
    - _Requirements: 9.1, 9.2, 9.7, 21.4_

  - [ ] 22.2 Configure Next.js settings
    - Configure next.config.js for API proxy
    - Set up environment variables (.env.local, .env.production)
    - Configure image optimization
    - Set up font optimization
    - _Requirements: 20.4, 20.5_

  - [ ] 22.3 Create root layout and error boundaries
    - Create app/layout.tsx with metadata
    - Create app/error.tsx for error handling
    - Create app/not-found.tsx for 404 pages
    - Create app/loading.tsx for loading states
    - _Requirements: 9.2, 9.4_

  - [ ] 22.4 Set up shared UI components
    - Create components/ui directory
    - Migrate reusable components from Current_Web_Frontend
    - Ensure components use Tailwind CSS
    - _Requirements: 9.7, 22.6_

- [ ] 23. Implement authentication for Next.js
  - [ ] 23.1 Set up NextAuth.js or auth solution
    - Install and configure authentication library
    - Create auth configuration with JWT strategy
    - Implement session management
    - _Requirements: 9.6, 13.3_

  - [ ] 23.2 Create authentication middleware
    - Implement middleware.ts for protected routes
    - Add authentication checks
    - Handle token refresh
    - _Requirements: 9.6, 13.4_

  - [ ] 23.3 Create API client utilities
    - Create lib/api directory
    - Implement fetch wrappers with authentication
    - Add error handling utilities
    - _Requirements: 9.3, 22.5_

- [ ] 24. Migrate Login page
  - [ ] 24.1 Create login page with Server Actions
    - Create app/login/page.tsx
    - Implement login form as Client Component
    - Create Server Action for authentication
    - Handle authentication errors
    - _Requirements: 10.1, 9.4_

  - [ ]* 24.2 Write tests for login page
    - Test login form submission
    - Test error handling
    - Test redirect after successful login
    - _Requirements: 25.1, 25.6_

- [ ] 25. Migrate Dashboard page
  - [ ] 25.1 Create dashboard page with Server Components
    - Create app/dashboard/page.tsx
    - Fetch dashboard data in Server Component
    - Implement loading.tsx for streaming UI
    - Create dashboard widgets as Server Components
    - _Requirements: 10.2, 9.3, 9.4_

  - [ ] 25.2 Implement dashboard client components
    - Create interactive charts as Client Components
    - Add real-time update functionality
    - Implement optimistic updates
    - _Requirements: 9.5, 11.6_

  - [ ]* 25.3 Write tests for dashboard page
    - Test data fetching
    - Test widget rendering
    - Test interactive features
    - _Requirements: 25.1, 25.6_

- [ ] 26. Migrate Showroom Detail page
  - [ ] 26.1 Create dynamic showroom page
    - Create app/showrooms/[id]/page.tsx
    - Implement dynamic route parameter handling
    - Fetch showroom data in Server Component
    - Create loading.tsx for streaming
    - _Requirements: 10.3, 9.3, 9.4_

  - [ ] 26.2 Create Server Actions for showroom operations
    - Create actions for sale entry creation
    - Create actions for payment recording
    - Implement revalidatePath for cache updates
    - _Requirements: 9.4, 11.2_

  - [ ]* 26.3 Write tests for showroom page
    - Test dynamic routing
    - Test data fetching
    - Test Server Actions
    - _Requirements: 25.1, 25.6_


- [ ] 27. Migrate Queue Management page
  - [ ] 27.1 Create queue management page
    - Create app/queues/page.tsx
    - Fetch queue data in Server Component
    - Create app/queues/unknown/page.tsx
    - Create app/queues/unmatched/page.tsx
    - _Requirements: 10.4, 9.3_

  - [ ] 27.2 Create Server Actions for queue operations
    - Create actions for manual matching
    - Create actions for queue item dismissal
    - Implement revalidatePath for updates
    - _Requirements: 9.4, 11.2_

  - [ ]* 27.3 Write tests for queue pages
    - Test queue data fetching
    - Test Server Actions
    - _Requirements: 25.1, 25.6_

- [ ] 28. Migrate Transaction List page
  - [ ] 28.1 Create transaction list page
    - Create app/transactions/page.tsx
    - Fetch transaction data with pagination
    - Implement filtering and sorting
    - Create loading.tsx for streaming
    - _Requirements: 10.5, 9.3, 9.4_

  - [ ] 28.2 Implement transaction list client features
    - Add interactive filters as Client Components
    - Implement pagination controls
    - Add search functionality
    - _Requirements: 9.5, 11.6_

  - [ ]* 28.3 Write tests for transaction list
    - Test pagination
    - Test filtering
    - Test sorting
    - _Requirements: 25.1, 25.6_

- [ ] 29. Migrate Export page
  - [ ] 29.1 Create export page
    - Create app/export/page.tsx
    - Fetch export options in Server Component
    - _Requirements: 10.6, 9.3_

  - [ ] 29.2 Create Server Actions for exports
    - Create action for Tally export generation
    - Create action for Excel export generation
    - Handle file downloads
    - _Requirements: 9.4, 11.2_

  - [ ]* 29.3 Write tests for export page
    - Test export generation
    - Test file downloads
    - _Requirements: 25.1, 25.6_

- [ ] 30. Migrate CA OS features
  - [ ] 30.1 Create CA OS timeline page
    - Create app/ca-os/timeline/page.tsx
    - Fetch timeline data in Server Component
    - Implement TimelineView as Server Component
    - _Requirements: 10.7, 9.3_

  - [ ] 30.2 Create CA OS alerts page
    - Create app/ca-os/alerts/page.tsx
    - Fetch alerts data in Server Component
    - Implement AlertsDashboard as Server Component
    - _Requirements: 10.7, 9.3_

  - [ ] 30.3 Create CA OS summary page
    - Create app/ca-os/summary/page.tsx
    - Fetch summary data in Server Component
    - Implement SmartSummary as Server Component
    - _Requirements: 10.7, 9.3_

  - [ ]* 30.4 Write tests for CA OS pages
    - Test timeline rendering
    - Test alerts rendering
    - Test summary rendering
    - _Requirements: 25.1, 25.6_

- [ ] 31. Checkpoint - Verify all pages migrated
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 32. Implement SEO optimization
  - [ ] 32.1 Add metadata to all pages
    - Implement generateMetadata for dynamic pages
    - Add Open Graph tags
    - Add Twitter Card tags
    - _Requirements: 12.1, 12.2_

  - [ ] 32.2 Create SEO utilities
    - Generate sitemap.xml
    - Create robots.txt
    - Implement structured data (JSON-LD)
    - _Requirements: 12.3, 12.4, 12.6_

  - [ ] 32.3 Optimize for accessibility and SEO
    - Use semantic HTML elements
    - Add proper heading hierarchy
    - Ensure proper alt text for images
    - _Requirements: 12.5, 12.7_

- [ ] 33. Implement data fetching optimizations
  - [ ] 33.1 Configure caching strategies
    - Implement ISR for frequently accessed pages
    - Configure cache revalidation times
    - Use force-cache for static data
    - Use no-store for dynamic data
    - _Requirements: 11.5_

  - [ ] 33.2 Implement prefetching
    - Add prefetch for likely navigation targets
    - Use Link component with prefetch
    - _Requirements: 11.7_

  - [ ] 33.3 Optimize loading states
    - Implement Suspense boundaries
    - Create skeleton loaders
    - Implement streaming UI
    - _Requirements: 11.3_

- [ ] 34. Performance optimization
  - [ ] 34.1 Optimize bundle size
    - Analyze bundle with Next.js analyzer
    - Implement code splitting
    - Use dynamic imports for heavy components
    - _Requirements: 15.4_

  - [ ] 34.2 Optimize images and fonts
    - Use Next.js Image component
    - Implement font optimization
    - Add lazy loading for images
    - _Requirements: 11.8_

  - [ ]* 34.3 Run Lighthouse audits
    - Test performance score
    - Test accessibility score
    - Test SEO score
    - Verify performance score >= 90
    - _Requirements: 15.6_

- [ ] 35. Set up Vercel deployment
  - [ ] 35.1 Configure Vercel project
    - Connect GitHub repository
    - Configure environment variables
    - Set up preview deployments
    - Configure production domain
    - _Requirements: 17.1, 17.6, 28.1_

  - [ ] 35.2 Set up CI/CD pipeline for frontend
    - Configure GitHub Actions for testing
    - Add build verification step
    - Configure automatic deployment to Vercel
    - Set up staging and production environments
    - _Requirements: 17.1, 17.3, 17.7_

  - [ ] 35.3 Implement error tracking
    - Set up Sentry or similar service
    - Configure error reporting
    - Add source maps for debugging
    - _Requirements: 18.7_

- [ ] 36. Implement Blue-Green deployment for frontend
  - [ ] 36.1 Deploy Target_Web_Frontend to staging
    - Deploy Next.js app to Vercel staging
    - Run smoke tests against staging
    - Verify all pages load correctly
    - _Requirements: 2.4, 17.4_

  - [ ] 36.2 Configure traffic routing for frontend
    - Set up traffic splitting in Vercel or CDN
    - Configure 10% traffic to Target_Web_Frontend initially
    - Implement traffic monitoring
    - _Requirements: 2.4, 26.1, 26.6_

  - [ ] 36.3 Implement gradual rollout for frontend
    - Monitor error rates and performance
    - Increase traffic by 20% every 2 hours if stable
    - Implement automatic rollback on issues
    - _Requirements: 26.2, 26.3, 26.4, 26.6_

- [ ] 37. Visual regression testing
  - [ ]* 37.1 Set up visual regression tests
    - Install and configure visual testing tool
    - Capture baseline screenshots
    - _Requirements: 25.6_

  - [ ]* 37.2 Run visual regression tests
    - Compare Target_Web_Frontend with Current_Web_Frontend
    - Verify visual equivalence for all pages
    - _Requirements: 9.8, 10.8, 25.6_

- [ ] 38. Final Phase 2 checkpoint
  - Ensure all tests pass, verify Target_Web_Frontend serves 100% traffic for 24 hours, ask the user if questions arise.


### Phase 3: Integration and Optimization

- [ ] 39. Remove compatibility layers
  - [ ] 39.1 Remove Current_Backend compatibility code
    - Remove any temporary compatibility shims
    - Clean up dual-version support code
    - Update configuration to production settings
    - _Requirements: 1.7_

  - [ ] 39.2 Remove Current_Web_Frontend compatibility code
    - Remove any temporary compatibility shims
    - Clean up feature flags for migration
    - _Requirements: 1.7_

- [ ] 40. Optimize database queries
  - [ ] 40.1 Add database indexes
    - Analyze query patterns
    - Add indexes for frequently queried fields
    - Verify index usage with explain plans
    - _Requirements: 15.1, 15.3_

  - [ ] 40.2 Optimize aggregation pipelines
    - Review and optimize MongoDB aggregations
    - Add caching for expensive queries
    - _Requirements: 15.1_

- [ ] 41. Implement feature flag system
  - [ ] 41.1 Create feature flag infrastructure
    - Implement feature flag service in NestJS
    - Create feature flag configuration
    - Add feature flag middleware
    - _Requirements: 29.1, 29.3_

  - [ ] 41.2 Integrate feature flags in Next.js
    - Create feature flag context
    - Implement feature flag checks in components
    - Add feature flag logging
    - _Requirements: 29.2, 29.6_

  - [ ] 41.3 Implement advanced feature flag capabilities
    - Add user-specific feature flags
    - Implement percentage-based rollouts
    - Create feature flag admin interface
    - _Requirements: 29.4, 29.5, 29.7_

- [ ] 42. Update documentation
  - [ ] 42.1 Update README and setup guides
    - Update README.md with new tech stack
    - Update developer setup instructions
    - Document local development workflow
    - _Requirements: 23.1, 23.7_

  - [ ] 42.2 Document architecture and patterns
    - Document NestJS module structure
    - Document Next.js routing patterns
    - Document data fetching strategies
    - Document Server Actions usage
    - _Requirements: 23.2, 23.3_

  - [ ] 42.3 Update API documentation
    - Verify OpenAPI/Swagger documentation is complete
    - Add usage examples
    - Document authentication flow
    - _Requirements: 23.4_

  - [ ] 42.4 Document deployment and operations
    - Document environment variables
    - Document deployment procedures
    - Document rollback procedures
    - Document monitoring and alerting
    - _Requirements: 23.5, 23.6_

- [ ] 43. Dependency updates and security
  - [ ] 43.1 Update all dependencies
    - Update NestJS to latest stable (10.x+)
    - Update Next.js to latest stable (14.x+)
    - Update Mongoose to latest stable (8.x+)
    - Update React to latest stable (18.x+)
    - _Requirements: 27.1, 27.2, 27.3, 27.4_

  - [ ] 43.2 Security audit
    - Run npm audit on all packages
    - Fix security vulnerabilities
    - Verify no known vulnerabilities remain
    - _Requirements: 27.5, 27.7_

  - [ ] 43.3 Document breaking changes
    - Document any breaking changes from updates
    - Update migration guide if needed
    - _Requirements: 27.6_

- [ ] 44. Cost optimization verification
  - [ ] 44.1 Verify free tier compliance
    - Monitor Vercel usage and limits
    - Monitor Railway/Render usage and limits
    - Monitor MongoDB Atlas usage
    - _Requirements: 28.1, 28.2, 28.3_

  - [ ] 44.2 Optimize resource usage
    - Optimize bundle sizes for Vercel limits
    - Optimize API request counts
    - Implement caching to reduce database queries
    - _Requirements: 28.4, 28.5_

  - [ ] 44.3 Set up usage monitoring
    - Configure alerts for approaching limits
    - Monitor resource usage trends
    - _Requirements: 28.6, 28.7_


- [ ] 45. Final system verification
  - [ ]* 45.1 Run complete test suite
    - Run all unit tests (backend and frontend)
    - Run all integration tests
    - Run all E2E tests
    - Verify all 52 correctness properties pass
    - _Requirements: 8.5, 8.6, 24.1, 24.2, 25.7_

  - [ ]* 45.2 Verify mobile app compatibility
    - Test all mobile API endpoints
    - Verify Mobile_App functions without updates
    - Test authentication flow from mobile
    - Verify response formats match expectations
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 30.6_

  - [ ]* 45.3 Performance verification
    - Run load tests against production
    - Verify 30% improvement in backend response times
    - Verify 40% improvement in frontend FCP
    - Verify 50% improvement in concurrent request handling
    - Verify Lighthouse score >= 90
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 30.5_

  - [ ]* 45.4 Stability verification
    - Monitor Target_Backend serving 100% traffic for 7 days
    - Monitor Target_Web_Frontend serving 100% traffic for 7 days
    - Verify error rates remain below 0.5%
    - Verify no critical issues reported
    - _Requirements: 30.2, 30.3, 30.8_

- [ ] 46. Decommission old systems
  - [ ] 46.1 Archive Current_Backend
    - Create final backup of Current_Backend code
    - Document final state
    - Archive deployment configuration
    - _Requirements: 1.7, 16.1_

  - [ ] 46.2 Archive Current_Web_Frontend
    - Create final backup of Current_Web_Frontend code
    - Document final state
    - Archive deployment configuration
    - _Requirements: 1.7, 16.1_

  - [ ] 46.3 Decommission infrastructure
    - Shut down Current_Backend deployment
    - Shut down Current_Web_Frontend deployment
    - Update DNS and routing
    - _Requirements: 1.7, 30.7_

- [ ] 47. Migration completion verification
  - [ ] 47.1 Verify all completion criteria
    - Confirm all three phases completed
    - Confirm Target_Backend stable for 7 days
    - Confirm Target_Web_Frontend stable for 7 days
    - Confirm all correctness properties pass
    - Confirm performance improvements achieved
    - Confirm mobile app compatibility
    - Confirm old systems decommissioned
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7_

  - [ ] 47.2 Create migration completion report
    - Document migration timeline
    - Document performance improvements
    - Document lessons learned
    - Document known issues and future improvements
    - _Requirements: 30.8_

- [ ] 48. Final checkpoint - Migration complete
  - Ensure all completion criteria met, verify system stability, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing and verification tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the original system
- Unit and integration tests validate specific examples and edge cases
- The migration maintains zero downtime through Blue-Green deployment strategy
- All 52 existing correctness properties must pass throughout the migration
- Mobile app compatibility is verified without requiring mobile app changes
- Performance improvements are measured and verified against baselines
- Rollback procedures are documented and tested at each phase
