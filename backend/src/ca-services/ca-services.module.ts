import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaServicesController } from './ca-services.controller';
import { CaServicesService } from './ca-services.service';
import { CaService, CaServiceSchema } from '../schemas/ca-service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CaService.name, schema: CaServiceSchema }]),
  ],
  controllers: [CaServicesController],
  providers: [CaServicesService],
  exports: [CaServicesService],
})
export class CaServicesModule {}
