import {
  Controller,
  Get,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CaosService } from '../caos/caos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly svc: DashboardService,
    private readonly caosService: CaosService,
  ) {}

  /** CA dashboard summary */
  @Get('summary')
  @ApiOperation({
    summary: 'CA dashboard summary (connected clients, pending requests, unread reports)',
  })
  async getSummary(@Request() req: any) {
    try {
      return await this.svc.getDashboardSummary(req.user.userId);
    } catch (e: any) {
      throw new HttpException(
        { error: 'Failed to fetch summary' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Get connected showrooms */
  @Get('clients')
  @ApiOperation({ summary: 'Get showrooms connected to this CA' })
  async getClients(@Request() req: any) {
    try {
      return await this.svc.getConnectedShowrooms(req.user.userId);
    } catch (e: any) {
      throw new HttpException(
        { error: 'Failed to fetch clients' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Get pending connection requests */
  @Get('requests')
  @ApiOperation({ summary: 'Get pending connection requests' })
  async getRequests(@Request() req: any) {
    try {
      return await this.svc.getPendingRequests(req.user.userId);
    } catch (e: any) {
      throw new HttpException(
        { error: 'Failed to fetch requests' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Get received reports */
  @Get('reports')
  @ApiOperation({ summary: 'Get reports received from connected showrooms' })
  async getReports(@Request() req: any) {
    try {
      return await this.svc.getReceivedReports(req.user.userId);
    } catch (e: any) {
      throw new HttpException(
        { error: 'Failed to fetch reports' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** CA smart summary for a showroom (used by the SmartSummary component) */
  @Get('showrooms/:showroomId/summary')
  @ApiOperation({ summary: 'Smart summary for a showroom' })
  async getShowroomSummary(
    @Param('showroomId') showroomId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate) : new Date();
      return await this.caosService.generateSmartSummary(showroomId, start, end);
    } catch (e: any) {
      throw new HttpException(
        { error: 'Failed to fetch smart summary' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
