import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { Connection, ConnectionSchema } from '../schemas/connection.schema';
import { CaosModule } from '../caos/caos.module';
import { CaTasksModule } from '../ca-tasks/ca-tasks.module';

@Module({
  imports: [
    CaosModule,
    CaTasksModule,
    MongooseModule.forFeature([{ name: Connection.name, schema: ConnectionSchema }]),
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
