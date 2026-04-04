# Rekono Architectural Stress Test Report

## Scope
Reviewed the backend, web, and shared configuration paths with a focus on failure under load, privilege boundary violations, and brittle hydration/aggregation logic.

## Highest-Risk Weaknesses Identified
1. JWT validation was accepting an untyped payload and returning claims directly to the request context.
2. Several showroom-scoped routes relied on JWT auth only and did not enforce showroom membership.
3. CA client workspace aggregation could fail the entire request if one data source rejected.
4. Some controllers accessed `req.user.userId` without a null guard.
5. Schema status fields were stored as plain `string` types instead of narrow unions.

## Fixes Applied
- Tightened JWT validation in [backend/src/auth/strategies/jwt.strategy.ts](backend/src/auth/strategies/jwt.strategy.ts) to require a valid `sub` and hydrate user identity from the database.
- Added showroom access enforcement to [backend/src/sales/sales.controller.ts](backend/src/sales/sales.controller.ts) and [backend/src/queues/queues.controller.ts](backend/src/queues/queues.controller.ts) with `ShowroomAccessGuard`.
- Hardened request-user access in [backend/src/sales/sales.controller.ts](backend/src/sales/sales.controller.ts), [backend/src/ca-clients/ca-clients.controller.ts](backend/src/ca-clients/ca-clients.controller.ts), and [backend/src/dashboard/dashboard.controller.ts](backend/src/dashboard/dashboard.controller.ts).
- Made [backend/src/ca-clients/ca-clients.service.ts](backend/src/ca-clients/ca-clients.service.ts) resilient with `Promise.allSettled` and explicit workspace warnings instead of hard failure.
- Narrowed schema status types in [backend/src/schemas/connection.schema.ts](backend/src/schemas/connection.schema.ts) and [backend/src/schemas/ca-client.schema.ts](backend/src/schemas/ca-client.schema.ts).

## Verification
- Backend TypeScript diagnostics are clean for all edited files.
- Backend test suite passed: 17/17 suites, 62/62 tests.

## Deep Pass (Second Sweep)
Performed a deeper stress-oriented audit focusing on showroom authorization consistency, webhook ingress paths, and high-cardinality query paths.

### Additional Critical Findings Confirmed
1. Multiple showroom-scoped controllers were still protected by JWT only.
2. Connections endpoints accepted showroom IDs in body/param without consistent ownership validation.
3. SMS authenticated ingest endpoint accepted showroom param without showroom access guard.
4. Command-center data assembly contained an unnecessary all-task fetch that scaled poorly.

### Additional Fixes Applied
- Added showroom scoping guard coverage to:
	- [backend/src/analytics/analytics.controller.ts](backend/src/analytics/analytics.controller.ts)
	- [backend/src/dashboard/dashboard.controller.ts](backend/src/dashboard/dashboard.controller.ts)
	- [backend/src/invoices/invoices.controller.ts](backend/src/invoices/invoices.controller.ts)
	- [backend/src/exports/exports.controller.ts](backend/src/exports/exports.controller.ts)
	- [backend/src/payments/sms-webhook.controller.ts](backend/src/payments/sms-webhook.controller.ts) for authenticated SMS receive route
- Hardened showroom ownership checks in body/param-driven connection flows in [backend/src/connections/connections.controller.ts](backend/src/connections/connections.controller.ts).
- Removed the unused full-task retrieval in [backend/src/ca-tasks/ca-tasks.service.ts](backend/src/ca-tasks/ca-tasks.service.ts) to reduce command-center query pressure.

### Deep-Pass Verification
- Backend diagnostics remained clean for edited files.
- Backend test suite re-run passed: 17/17 suites, 62/62 tests.

## Residual Risks
- The web app still uses per-file `NEXT_PUBLIC_API_URL` fallbacks in multiple places. That is a deployment-risk pattern, but it was not changed in this pass because it spans many files and should be handled as a dedicated config refactor.
- Some backend and test files still use broad `any` typing in lower-risk paths, especially in legacy controllers and test doubles.
- Background jobs can still surface domain warnings such as missing SMS provider detection or periodic evaluation failures; those are warnings, not build blockers.
- Some CA payment and task summary paths still perform large in-memory reductions on potentially high-cardinality datasets; they should be moved to paginated/aggregated query shapes in a dedicated performance pass.

## Recommendation
Next hardening pass should centralize frontend API configuration and remove the remaining `localhost` fallbacks from web entry points, then optionally tighten the remaining `any` surfaces in legacy controllers and services.
