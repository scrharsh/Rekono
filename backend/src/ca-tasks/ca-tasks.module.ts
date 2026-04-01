import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaTasksController } from './ca-tasks.controller';
import { CaTasksService } from './ca-tasks.service';
import { CaTask, CaTaskSchema } from '../schemas/ca-task.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: CaTask.name, schema: CaTaskSchema }])],
  controllers: [CaTasksController],
  providers: [CaTasksService],
  exports: [CaTasksService],
})
export class CaTasksModule {}
