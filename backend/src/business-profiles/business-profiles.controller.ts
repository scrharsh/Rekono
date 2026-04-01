import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessProfilesService } from './business-profiles.service';
import { UpsertBusinessProfileDto } from './dto/business-profile.dto';

@ApiTags('Business Profiles')
@Controller('business-profiles')
export class BusinessProfilesController {
  constructor(private readonly service: BusinessProfilesService) {}

  @Get('modes')
  @ApiOperation({ summary: 'Get supported business modes' })
  getModes() {
    return { modes: this.service.getBusinessModes() };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my business profile' })
  async getMyProfile(@Request() req: any) {
    const profile = await this.service.getMyProfile(req.user.userId);
    return this.service.toClientProfile(profile);
  }

  @Get('me/context')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get lightweight business context for app bootstrap' })
  async getMyContext(@Request() req: any) {
    const profile = await this.service.getMyProfile(req.user.userId);
    return this.service.toClientContext(profile);
  }

  @Post('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or update my business profile' })
  async upsertMyProfile(@Request() req: any, @Body() dto: UpsertBusinessProfileDto) {
    const profile = await this.service.upsertMyProfile(req.user.userId, dto);
    return this.service.toClientProfile(profile);
  }
}
