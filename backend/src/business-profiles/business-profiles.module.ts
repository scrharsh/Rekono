import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessProfilesController } from './business-profiles.controller';
import { BusinessProfilesService } from './business-profiles.service';
import { BusinessProfile, BusinessProfileSchema } from '../schemas/business-profile.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Showroom, ShowroomSchema } from '../schemas/showroom.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: User.name, schema: UserSchema },
      { name: Showroom.name, schema: ShowroomSchema },
    ]),
  ],
  controllers: [BusinessProfilesController],
  providers: [BusinessProfilesService],
  exports: [BusinessProfilesService],
})
export class BusinessProfilesModule {}
