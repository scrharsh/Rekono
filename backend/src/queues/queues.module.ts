import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';
import { SaleEntry, SaleEntrySchema } from '../schemas/sale-entry.schema';
import { PaymentRecord, PaymentRecordSchema } from '../schemas/payment-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleEntry.name, schema: SaleEntrySchema },
      { name: PaymentRecord.name, schema: PaymentRecordSchema },
    ]),
  ],
  controllers: [QueuesController],
  providers: [QueuesService],
  exports: [QueuesService],
})
export class QueuesModule {}
