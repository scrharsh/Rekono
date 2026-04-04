import { Controller, Get, Param, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShowroomAccessGuard } from '../auth/guards/showroom-access.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, ShowroomAccessGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('showroom/:showroomId')
  async getShowroomAnalytics(@Param('showroomId') showroomId: string) {
    try {
      const analytics = await this.analyticsService.getAnalyticsDashboard(showroomId);
      return analytics;
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to fetch analytics' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getGlobalAnalytics() {
    try {
      const analytics = await this.analyticsService.getAnalyticsDashboard();
      return analytics;
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to fetch analytics' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
