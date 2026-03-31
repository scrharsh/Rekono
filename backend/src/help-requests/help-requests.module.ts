import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HelpRequestsController } from './help-requests.controller';
import { HelpRequestsService } from './help-requests.service';
import { HelpRequest, HelpRequestSchema } from '../schemas/help-request.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: HelpRequest.name, schema: HelpRequestSchema }])],
  controllers: [HelpRequestsController],
  providers: [HelpRequestsService],
  exports: [HelpRequestsService],
})
export class HelpRequestsModule {}
