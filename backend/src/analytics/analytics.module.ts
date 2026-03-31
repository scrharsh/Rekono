import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SaleEntry, SaleEntrySchema } from '../schemas/sale-entry.schema';
import { PaymentRecord, PaymentRecordSchema } from '../schemas/payment-record.schema';
import { Match, MatchSchema } from '../schemas/match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleEntry.name, schema: SaleEntrySchema },
      { name: PaymentRecord.name, schema: PaymentRecordSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
