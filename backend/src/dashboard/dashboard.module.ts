import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Connection, ConnectionSchema } from '../schemas/connection.schema';
import { SharedReport, SharedReportSchema } from '../schemas/shared-report.schema';
import { CaosModule } from '../caos/caos.module';

@Module({
  imports: [
    CaosModule,
    MongooseModule.forFeature([
      { name: Connection.name, schema: ConnectionSchema },
      { name: SharedReport.name, schema: SharedReportSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
