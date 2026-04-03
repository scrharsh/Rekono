import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AlertService } from './alert.service';

@ApiTags('ca-alert-jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ca/alerts/jobs')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post('run')
  @Roles('ca', 'admin')
  @ApiOperation({ summary: 'Manually run alert and automation jobs for current CA' })
  async runForCurrentCA(@Request() req: any) {
    return this.alertService.triggerForCA(req.user.userId);
  }
}
