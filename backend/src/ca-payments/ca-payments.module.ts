import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaPaymentsController } from './ca-payments.controller';
import { CaPaymentsService } from './ca-payments.service';
import { CaPayment, CaPaymentSchema } from '../schemas/ca-payment.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: CaPayment.name, schema: CaPaymentSchema }])],
  controllers: [CaPaymentsController],
  providers: [CaPaymentsService],
  exports: [CaPaymentsService],
})
export class CaPaymentsModule {}
