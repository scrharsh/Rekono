import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
// New modules — Rekono OS
import { CaClientsModule } from './ca-clients/ca-clients.module';
import { CaServicesModule } from './ca-services/ca-services.module';
import { CaPaymentsModule } from './ca-payments/ca-payments.module';
import { CaDocumentsModule } from './ca-documents/ca-documents.module';
import { CaTasksModule } from './ca-tasks/ca-tasks.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AuditModule } from './audit/audit.module';
import { CatalogModule } from './catalog/catalog.module';
import { BusinessProfilesModule } from './business-profiles/business-profiles.module';
import { AlertModule } from './alert/alert.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const ttl = Number(configService.get('THROTTLE_TTL_MS') ?? configService.get('THROTTLE_TTL') ?? 60000);
        const limit = Number(configService.get('THROTTLE_LIMIT') ?? 100);

        return [
          {
            ttl,
            limit,
          },
        ];
      },
    }),
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
    // New modules — Rekono OS
    CaClientsModule,
    CaServicesModule,
    CaPaymentsModule,
    CaDocumentsModule,
    CaTasksModule,
    KnowledgeModule,
    AuditModule,
    CatalogModule,
    BusinessProfilesModule,
    AlertModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    LoggingInterceptor,
    AuditInterceptor,
  ],
})
export class AppModule {}
