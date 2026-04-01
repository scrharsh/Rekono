# Rekono - Turn Transactions into Clarity

Rekono is a sale-first transaction reconciliation system for GST-registered showrooms in India. It automatically captures UPI payment notifications via SMS, matches them with sale entries, and generates GST-compliant outputs for Tally import.

## System Overview

- **For Stores**: Mobile app for sale entry, SMS payment capture, and automatic matching
- **For CAs**: Web-based intelligent operating system with task engine, health scores, and risk alerts
- **Architecture**: Monorepo with React Native mobile, NestJS backend, and React web app

## Project Structure

```
rekono/
├── desktop/         # Electron shells for Business OS and CA OS
├── mobile/          # React Native mobile app (Android)
├── backend/         # NestJS API server (migrated from Express)
├── web/             # React web app (Vite)
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
- **Web**: React, TypeScript, Vite, Tailwind CSS
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

🚧 **Next Phase**: Next.js frontend migration (React/Vite → Next.js 14+)

## Desktop Surfaces

- `desktop/business-app` provides a Business OS workspace for reconciliation and reporting.
- `desktop/ca-app` provides a CA OS workspace for client operations and compliance work.

## License

Proprietary - All rights reserved
