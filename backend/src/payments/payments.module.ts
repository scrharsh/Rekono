import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentRecord, PaymentRecordSchema } from '../schemas/payment-record.schema';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PaymentRecord.name, schema: PaymentRecordSchema }]),
    MatchingModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
