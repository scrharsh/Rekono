import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { Match, MatchSchema } from '../schemas/match.schema';
import { SaleEntry, SaleEntrySchema } from '../schemas/sale-entry.schema';
import { PaymentRecord, PaymentRecordSchema } from '../schemas/payment-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: SaleEntry.name, schema: SaleEntrySchema },
      { name: PaymentRecord.name, schema: PaymentRecordSchema },
    ]),
  ],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
