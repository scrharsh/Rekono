import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaosController } from './caos.controller';
import { CaosService } from './caos.service';
import { SaleEntry, SaleEntrySchema } from '../schemas/sale-entry.schema';
import { PaymentRecord, PaymentRecordSchema } from '../schemas/payment-record.schema';
import { Match, MatchSchema } from '../schemas/match.schema';
import { Connection, ConnectionSchema } from '../schemas/connection.schema';
import { Showroom, ShowroomSchema } from '../schemas/showroom.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Connection.name, schema: ConnectionSchema },
      { name: Showroom.name, schema: ShowroomSchema },
      { name: SaleEntry.name, schema: SaleEntrySchema },
      { name: PaymentRecord.name, schema: PaymentRecordSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
  ],
  controllers: [CaosController],
  providers: [CaosService],
  exports: [CaosService],
})
export class CaosModule {}
