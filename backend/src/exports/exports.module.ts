import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { SaleEntry, SaleEntrySchema } from '../schemas/sale-entry.schema';
import { Match, MatchSchema } from '../schemas/match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleEntry.name, schema: SaleEntrySchema },
      { name: Match.name, schema: MatchSchema },
    ]),
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
