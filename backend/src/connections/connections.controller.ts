import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(
    private readonly svc: ConnectionsService,
    private readonly reportsSvc: ReportsService,
  ) {}

  /** Search for a CA by username (used by showroom staff) */
  @Get('ca/search/:username')
  @ApiOperation({ summary: 'Find a CA by username' })
  async findCA(@Param('username') username: string) {
    return this.svc.findCA(username);
  }

  /** Showroom requests connection to a CA */
  @Post('request')
  @ApiOperation({ summary: 'Showroom requests connection to a CA' })
  async request(@Body() body: { showroomId: string; caUsername: string; message?: string }) {
    try {
      return await this.svc.requestConnection(body.showroomId, body.caUsername, body.message);
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  /** CA accepts a connection request */
  @Patch(':id/accept')
  @ApiOperation({ summary: 'CA accepts a connection request' })
  async accept(@Param('id') id: string, @Request() req: any) {
    try {
      return await this.svc.acceptConnection(id, req.user.userId);
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  /** CA rejects a connection request */
  @Patch(':id/reject')
  @ApiOperation({ summary: 'CA rejects a connection request' })
  async reject(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req: any) {
    try {
      return await this.svc.rejectConnection(id, req.user.userId, body.reason);
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  /** Showroom disconnects from CA */
  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect from a CA' })
  async disconnect(@Param('id') id: string, @Body() body: { showroomId: string }) {
    try {
      await this.svc.disconnect(id, body.showroomId);
      return { success: true };
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  /** Get connections for a showroom */
  @Get('showroom/:showroomId')
  @ApiOperation({ summary: 'Get all connections for a showroom' })
  async getShowroomConnections(@Param('showroomId') showroomId: string) {
    return this.svc.getShowroomConnections(showroomId);
  }

  /** Get connection requests for the logged-in CA */
  @Get('ca/mine')
  @ApiOperation({ summary: 'Get all connection requests for the logged-in CA' })
  async getCAConnections(@Request() req: any) {
    return this.svc.getCAConnections(req.user.userId);
  }

  // ── Reports ──────────────────────────────────────────────────────────────

  /** Showroom sends a report to a connected CA */
  @Post('reports/send')
  @ApiOperation({ summary: 'Showroom sends a report to their connected CA' })
  async sendReport(
    @Body()
    body: {
      showroomId: string;
      caUserId: string;
      reportType: string;
      fileName: string;
      period: string;
      notes?: string;
      fileUrl?: string;
    },
  ) {
    try {
      return await this.reportsSvc.sendReport(
        body.showroomId,
        body.caUserId,
        body.reportType,
        body.fileName,
        body.period,
        body.notes,
        body.fileUrl,
      );
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  /** Showroom gets reports they've sent */
  @Get('reports/showroom/:showroomId')
  @ApiOperation({ summary: 'Get reports sent by a showroom' })
  async getShowroomReports(@Param('showroomId') showroomId: string) {
    return this.reportsSvc.getShowroomReports(showroomId);
  }

  /** CA marks a report as read */
  @Patch('reports/:reportId/read')
  @ApiOperation({ summary: 'CA marks a report as read' })
  async markRead(@Param('reportId') reportId: string, @Request() req: any) {
    try {
      return await this.reportsSvc.markRead(reportId, req.user.userId);
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }
}
