import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SaleEntry, SaleEntrySchema } from '../schemas/sale-entry.schema';
import { Showroom, ShowroomSchema } from '../schemas/showroom.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleEntry.name, schema: SaleEntrySchema },
      { name: Showroom.name, schema: ShowroomSchema },
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
