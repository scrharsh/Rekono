# Design Document: Rekono Migration to NestJS and Next.js

## Overview

This document specifies the technical design for migrating Rekono MVP from Express/React to NestJS/Next.js. The migration follows a three-phase incremental approach ensuring zero downtime, complete feature parity, and measurable performance improvements.

### Migration Goals

- Migrate backend from Express to NestJS for better modularity and type safety
- Migrate web frontend from React/Vite to Next.js 14+ for SSR, improved SEO, and performance
- Maintain 100% API compatibility for React Native mobile app (no mobile changes required)
- Achieve zero downtime through Blue-Green deployment strategy
- Improve backend response times by 30% and frontend FCP by 40%
- Preserve all 52 existing correctness properties from the original system
- Maintain zero-cost deployment on free tiers (Vercel, Railway/Render, MongoDB Atlas)

### Current System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Current System                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ React Native │         │ React + Vite │                  │
│  │  Mobile App  │         │  Web Frontend│                  │
│  │              │         │              │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                          │
│         │    HTTP/REST API       │                          │
│         └────────┬───────────────┘                          │
│                  │                                           │
│         ┌────────▼────────┐                                 │
│         │  Express.js     │                                 │
│         │  Backend API    │                                 │
│         │  + Mongoose     │                                 │
│         └────────┬────────┘                                 │
│                  │                                           │
│         ┌────────▼────────┐                                 │
│         │  MongoDB Atlas  │                                 │
│         │  (Free Tier)    │                                 │
│         └─────────────────┘                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Target System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Target System                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ React Native │         │   Next.js 14 │                  │
│  │  Mobile App  │         │  App Router  │                  │
│  │ (Unchanged)  │         │  + RSC + SA  │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                          │
│         │    HTTP/REST API       │ Server Actions           │
│         └────────┬───────────────┘                          │
│                  │                                           │
│         ┌────────▼────────┐                                 │
│         │    NestJS       │                                 │
│         │  Backend API    │                                 │
│         │  + Mongoose     │                                 │
│         │  + DI + Guards  │                                 │
│         └────────┬────────┘                                 │
│                  │                                           │
│         ┌────────▼────────┐                                 │
│         │  MongoDB Atlas  │                                 │
│         │  (Same DB)      │                                 │
│         └─────────────────┘                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Migration Phases

The migration is structured into three sequential phases, each with specific deliverables and rollback points:

**Phase 1: Backend Migration (Express → NestJS)**
- Duration: 2-3 weeks
- Deliverable: NestJS backend serving 100% of API traffic
- Rollback Point: Switch traffic back to Express backend

**Phase 2: Web Frontend Migration (React/Vite → Next.js)**
- Duration: 2-3 weeks  
- Deliverable: Next.js frontend serving 100% of web traffic
- Rollback Point: Switch traffic back to React/Vite frontend

**Phase 3: Integration and Optimization**
- Duration: 1 week
- Deliverable: Optimized system with compatibility layers removed
- Rollback Point: Re-enable compatibility layers

## Architecture

### NestJS Backend Architecture

#### Module Structure

The NestJS backend is organized into feature modules following domain-driven design principles:

```
backend-nestjs/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── config/                    # Configuration module
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   ├── common/                    # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth guards
│   │   ├── interceptors/          # Logging, transform
│   │   ├── pipes/                 # Validation pipes
│   │   └── middleware/            # Custom middleware
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   └── strategies/
│   ├── sales/                     # Sales module
│   │   ├── sales.module.ts
│   │   ├── sales.controller.ts
│   │   ├── sales.service.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── payments/                  # Payments module
│   ├── matching/                  # Matching engine module
│   ├── invoices/                  # Invoice generation module
│   ├── exports/                   # Export module
│   ├── caos/                      # CA OS module
│   ├── queues/                    # Queue management module
│   ├── dashboard/                 # Dashboard module
│   ├── analytics/                 # Analytics module
│   └── help-requests/             # Help requests module
└── test/                          # E2E tests
```

#### Dependency Injection Pattern

```typescript
// Example: Sales Module with DI
@Module({
  imports: [MongooseModule.forFeature([{ name: SaleEntry.name, schema: SaleEntrySchema }])],
  controllers: [SalesController],
  providers: [SalesService, SmsParserService],
  exports: [SalesService], // Available to other modules
})
export class SalesModule {}

// Service with injected dependencies
@Injectable()
export class SalesService {
  constructor(
    @InjectModel(SaleEntry.name) private saleModel: Model<SaleEntry>,
    private smsParserService: SmsParserService,
    private logger: Logger,
  ) {}
}
```

#### Request Processing Pipeline

```
Incoming Request
      │
      ▼
┌─────────────┐
│  Middleware │  (CORS, Helmet, Body Parser)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Guards    │  (JWT Auth, Role-based)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Interceptors│  (Logging, Transform)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Pipes    │  (Validation, Sanitization)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Controller │  (Route Handler)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │  (Business Logic)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Repository │  (Data Access)
└──────┬──────┘
       │
       ▼
   Response
```

### Next.js Frontend Architecture

#### App Router Structure

```
web-nextjs/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   ├── loading.tsx                # Loading UI
│   ├── error.tsx                  # Error boundary
│   ├── not-found.tsx              # 404 page
│   ├── login/
│   │   └── page.tsx               # Login page (Server Action)
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard layout
│   │   ├── page.tsx               # Dashboard (Server Component)
│   │   └── loading.tsx
│   ├── showrooms/
│   │   ├── page.tsx               # Showrooms list
│   │   └── [id]/
│   │       ├── page.tsx           # Showroom detail (Dynamic)
│   │       └── loading.tsx
│   ├── queues/
│   │   ├── page.tsx               # Queue management
│   │   ├── unknown/
│   │   └── unmatched/
│   ├── transactions/
│   │   └── page.tsx               # Transaction list
│   ├── export/
│   │   └── page.tsx               # Export page
│   ├── ca-os/
│   │   ├── timeline/
│   │   ├── alerts/
│   │   └── summary/
│   └── api/                       # API routes (if needed)
├── components/
│   ├── ui/                        # Reusable UI components
│   ├── server/                    # Server Components
│   └── client/                    # Client Components
├── lib/
│   ├── actions/                   # Server Actions
│   ├── api/                       # API client functions
│   └── utils/                     # Utility functions
└── public/                        # Static assets
```

#### Server Components vs Client Components

**Server Components (Default):**
- Data fetching components
- Static content rendering
- Dashboard widgets
- Timeline views
- Analytics displays

**Client Components ('use client'):**
- Interactive forms
- Real-time updates
- Charts and visualizations
- Modal dialogs
- Toast notifications

#### Data Fetching Strategy

```typescript
// Server Component - Direct data fetching
export default async function DashboardPage() {
  const data = await fetch('http://localhost:3000/v1/dashboard', {
    cache: 'no-store', // or 'force-cache' for static
    next: { revalidate: 60 }, // ISR
  });
  
  return <DashboardView data={data} />;
}

// Server Action - Form submission
'use server'
export async function createSaleEntry(formData: FormData) {
  const result = await fetch('http://localhost:3000/v1/showrooms/sales', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(formData)),
  });
  
  revalidatePath('/dashboard');
  return result;
}
```

## Components and Interfaces

### API Contract Preservation

All existing API endpoints must be preserved with identical request/response formats to ensure mobile app compatibility.

#### Core API Endpoints

**Authentication:**
- POST /v1/auth/register
- POST /v1/auth/login
- GET /v1/auth/me

**Sales:**
- POST /v1/showrooms/:showroomId/sales
- GET /v1/showrooms/:showroomId/sales
- GET /v1/showrooms/:showroomId/sales/:saleId
- PUT /v1/showrooms/:showroomId/sales/:saleId
- DELETE /v1/showrooms/:showroomId/sales/:saleId

**Payments:**
- POST /v1/showrooms/:showroomId/payments
- GET /v1/showrooms/:showroomId/payments
- GET /v1/showrooms/:showroomId/payments/:paymentId

**Matching:**
- POST /v1/showrooms/:showroomId/match
- GET /v1/showrooms/:showroomId/matches
- DELETE /v1/showrooms/:showroomId/matches/:matchId

**Queues:**
- GET /v1/showrooms/:showroomId/queues/unknown
- GET /v1/showrooms/:showroomId/queues/unmatched

**Invoices:**
- POST /v1/showrooms/:showroomId/invoices
- GET /v1/showrooms/:showroomId/invoices

**Exports:**
- POST /v1/showrooms/:showroomId/export/tally
- POST /v1/showrooms/:showroomId/export/excel

**Dashboard:**
- GET /v1/dashboard

**CA OS:**
- GET /v1/ca-os/timeline
- GET /v1/ca-os/alerts
- GET /v1/ca-os/summary

**Analytics:**
- GET /v1/analytics/showroom/:showroomId

**Help Requests:**
- POST /v1/help-requests
- GET /v1/help-requests

### NestJS Controller Example

```typescript
@Controller('showrooms/:showroomId/sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('showroom_owner')
  async create(
    @Param('showroomId') showroomId: string,
    @Body() createSaleDto: CreateSaleDto,
  ): Promise<SaleEntry> {
    return this.salesService.create(showroomId, createSaleDto);
  }

  @Get()
  async findAll(
    @Param('showroomId') showroomId: string,
    @Query() query: PaginationDto,
  ): Promise<{ sales: SaleEntry[]; total: number }> {
    return this.salesService.findAll(showroomId, query);
  }
}
```

### NestJS DTO Definitions

```typescript
// auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsEnum(['showroom_owner', 'ca'])
  role: string;
}

// sales/dto/create-sale.dto.ts
import { IsNumber, IsOptional, IsString, IsISO8601, Min } from 'class-validator';

export class CreateSaleDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsISO8601()
  timestamp: string;
}
```

## Data Models

### Database Strategy

**Critical Constraint:** The MongoDB database schema must remain completely unchanged. Both Express and NestJS backends will connect to the same database during the transition period.

#### Mongoose Schema Compatibility

All Mongoose schemas must remain identical:

```typescript
// NestJS Schema Definition
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SaleEntry extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Showroom', required: true })
  showroomId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop()
  customerName?: string;

  @Prop()
  customerPhone?: string;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const SaleEntrySchema = SchemaFactory.createForClass(SaleEntry);
```

#### Database Connection Configuration

```typescript
// config/database.config.ts
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        retryAttempts: 5,
        retryDelay: 3000,
        connectionFactory: (connection) => {
          connection.on('connected', () => {
            Logger.log('MongoDB connected', 'DatabaseModule');
          });
          connection.on('error', (error) => {
            Logger.error('MongoDB connection error', error, 'DatabaseModule');
          });
          connection.on('disconnected', () => {
            Logger.warn('MongoDB disconnected', 'DatabaseModule');
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

### JWT Token Compatibility

JWT tokens must remain valid across both backends during transition:

```typescript
// Shared JWT Payload Structure
interface JwtPayload {
  sub: string;        // User ID
  email: string;
  role: string;
  iat: number;        // Issued at
  exp: number;        // Expiration
}

// NestJS JWT Configuration
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Same secret as Express
        signOptions: {
          expiresIn: '7d', // Same expiration as Express
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

