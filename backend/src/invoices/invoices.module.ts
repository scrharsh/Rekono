import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { SaleEntry, SaleEntrySchema } from '../schemas/sale-entry.schema';
import { Showroom, ShowroomSchema } from '../schemas/showroom.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleEntry.name, schema: SaleEntrySchema },
      { name: Showroom.name, schema: ShowroomSchema },
    ]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
