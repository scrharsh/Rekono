import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './auth/auth.module';
import { SalesModule } from './sales/sales.module';
import { PaymentsModule } from './payments/payments.module';
import { MatchingModule } from './matching/matching.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ExportsModule } from './exports/exports.module';
import { CaosModule } from './caos/caos.module';
import { QueuesModule } from './queues/queues.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HelpRequestsModule } from './help-requests/help-requests.module';
import { ConnectionsModule } from './connections/connections.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    AuthModule,
    SalesModule,
    PaymentsModule,
    MatchingModule,
    InvoicesModule,
    ExportsModule,
    CaosModule,
    QueuesModule,
    DashboardModule,
    AnalyticsModule,
    HelpRequestsModule,
    ConnectionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
