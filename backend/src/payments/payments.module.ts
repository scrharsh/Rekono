import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SmsWebhookController } from './sms-webhook.controller';
import { SmsWebhookService } from './index';
import { PaymentRecord, PaymentRecordSchema } from '../schemas/payment-record.schema';
import { MatchingModule } from '../matching/matching.module';
import { SmsParserService } from '../common/services/sms-parser.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PaymentRecord.name, schema: PaymentRecordSchema }]),
    MatchingModule,
  ],
  controllers: [PaymentsController, SmsWebhookController],
  providers: [PaymentsService, SmsParserService, SmsWebhookService],
  exports: [PaymentsService, SmsWebhookService],
})
export class PaymentsModule {}
