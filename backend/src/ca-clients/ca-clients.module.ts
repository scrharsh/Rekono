import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaClientsController } from './ca-clients.controller';
import { CaClientsService } from './ca-clients.service';
import { CaClient, CaClientSchema } from '../schemas/ca-client.schema';
import { CaService, CaServiceSchema } from '../schemas/ca-service.schema';
import { CaPayment, CaPaymentSchema } from '../schemas/ca-payment.schema';
import { CaDocument, CaDocumentSchema } from '../schemas/ca-document.schema';
import { CaTask, CaTaskSchema } from '../schemas/ca-task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CaClient.name, schema: CaClientSchema },
      { name: CaService.name, schema: CaServiceSchema },
      { name: CaPayment.name, schema: CaPaymentSchema },
      { name: CaDocument.name, schema: CaDocumentSchema },
      { name: CaTask.name, schema: CaTaskSchema },
    ]),
  ],
  controllers: [CaClientsController],
  providers: [CaClientsService],
  exports: [CaClientsService],
})
export class CaClientsModule {}
