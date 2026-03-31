import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { ReportsService } from './reports.service';
import { Connection, ConnectionSchema } from '../schemas/connection.schema';
import { SharedReport, SharedReportSchema } from '../schemas/shared-report.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Showroom, ShowroomSchema } from '../schemas/showroom.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Connection.name, schema: ConnectionSchema },
      { name: SharedReport.name, schema: SharedReportSchema },
      { name: User.name, schema: UserSchema },
      { name: Showroom.name, schema: ShowroomSchema },
    ]),
  ],
  controllers: [ConnectionsController],
  providers: [ConnectionsService, ReportsService],
  exports: [ConnectionsService, ReportsService],
})
export class ConnectionsModule {}
