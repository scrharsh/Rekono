# Rekono - Turn Transactions into Clarity

Rekono is a sale-first transaction reconciliation system for GST-registered showrooms in India. It automatically captures UPI payment notifications via SMS, matches them with sale entries, and generates GST-compliant outputs for Tally import.

## System Overview

- **For Stores**: Mobile app for sale entry, SMS payment capture, and automatic matching
- **For CAs**: Web-based intelligent operating system with task engine, health scores, and risk alerts
- **Architecture**: Monorepo with React Native mobile, NestJS backend, and Next.js 14 web app

## Project Structure

```
rekono/
├── desktop/         # Electron shells for Business OS and CA OS
├── mobile/          # React Native mobile app (Android)
├── backend/         # NestJS API server (migrated from Express)
├── web/             # Next.js web app
├── package.json     # Root workspace configuration
└── README.md        # This file
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)
- Android Studio (for mobile development)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run backend server:
```bash
cd backend
npm run start:dev
```

Run web app:
```bash
cd web
npm run dev
```

Run mobile app:
```bash
cd mobile
npm start
```

Run desktop surfaces:
```bash
npm run desktop:business:start
npm run desktop:ca:start
```

### Build

Build backend:
```bash
cd backend
npm run build
```

Build web:
```bash
cd web
npm run build
```

### Testing

Run backend tests:
```bash
cd backend
npm test
```

### Linting and Formatting

Lint code:
```bash
cd backend
npm run lint
```

Format code:
```bash
cd backend
npm run format
```

## Tech Stack

- **Mobile**: React Native, TypeScript, SQLite
- **Backend**: NestJS, TypeScript, MongoDB, Mongoose
- **Web**: Next.js 14, React, TypeScript, Tailwind CSS
- **Testing**: Jest
- **API Documentation**: Swagger/OpenAPI

## Deployment

- **Backend**: Railway/Render (free tier)
- **Web**: Vercel (free tier)
- **Database**: MongoDB Atlas (free tier)
- **Mobile**: APK distribution

## Migration Status

✅ **Backend Migration Complete**: Successfully migrated from Express to NestJS
- All 10 modules implemented (Sales, Payments, Matching, Invoices, Exports, CAOS, Queues, Dashboard, Analytics, HelpRequests)
- 100% API compatibility maintained
- Same JWT authentication
- Complete business logic ported

✅ **Web Platform Updated**: Running on Next.js 14

## Production Launch Checklist

Before go-live, ensure all of the following are done:

1. Build and test gates
	- `npm run lint`
	- `npm run test`
	- `npm run build`

2. Required environment variables
	- Backend:
	  - `NODE_ENV=production`
	  - `MONGODB_URI`
	  - `JWT_SECRET`
	  - `ALLOWED_ORIGINS` (comma-separated, required in production)
	  - `PAYMENT_WEBHOOK_SECRET` or provider-specific webhook secrets
	- Web:
	  - `NEXT_PUBLIC_API_URL` (required in production)
	- Mobile (React Native):
	  - `REKONO_API_URL` (optional build-time override)
	  - If unset, mobile uses local API in dev and `https://rekono-backend.onrender.com` in production
	- Desktop (Electron shells):
	  - `REKONO_WEB_URL` (set to your Vercel app URL)

3. Deployment validation
	- Backend health endpoint/API reachable
	- Web can log in and call backend successfully
	- Auth refresh/logout flows verified
	- Business dashboard, item CRUD, and CA connection/reporting flows verified

4. Operational readiness
	- Monitoring and alerting configured
	- Backup/restore process validated
	- Rollback procedure documented

## Desktop Surfaces

- `desktop/business-app` provides a Business OS workspace for reconciliation and reporting.
- `desktop/ca-app` provides a CA OS workspace for client operations and compliance work.

## License

Proprietary - All rights reserved
