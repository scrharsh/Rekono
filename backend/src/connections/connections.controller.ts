import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShowroomAccessGuard } from '../auth/guards/showroom-access.guard';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(
    private readonly svc: ConnectionsService,
    private readonly reportsSvc: ReportsService,
  ) {}

  private parseNumber(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  private requireUser(req: any): { userId: string; role: string; showroomIds: string[] } {
    const user = req?.user;
    if (!user?.userId) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    return {
      userId: String(user.userId),
      role: String(user.role ?? ''),
      showroomIds: Array.isArray(user.showroomIds)
        ? user.showroomIds.map((id: any) => String(id))
        : [],
    };
  }

  private assertShowroomAccess(req: any, showroomId: string): void {
    const user = this.requireUser(req);
    if (user.role === 'admin' || user.role === 'ca') {
      return;
    }

    if (!user.showroomIds.includes(String(showroomId))) {
      throw new ForbiddenException('Access denied for requested showroom');
    }
  }

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
      const user = this.requireUser(req);
      return await this.svc.acceptConnection(id, user.userId);
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  /** CA rejects a connection request */
  @Patch(':id/reject')
  @ApiOperation({ summary: 'CA rejects a connection request' })
  async reject(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req: any) {
    try {
      const user = this.requireUser(req);
      return await this.svc.rejectConnection(id, user.userId, body.reason);
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  /** Showroom disconnects from CA */
  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect from a CA' })
  async disconnect(
    @Param('id') id: string,
    @Body() body: { showroomId: string },
    @Request() req: any,
  ) {
    try {
      this.assertShowroomAccess(req, body.showroomId);
      await this.svc.disconnect(id, body.showroomId);
      return { success: true };
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  /** Get connections for a showroom */
  @Get('showroom/:showroomId')
  @UseGuards(ShowroomAccessGuard)
  @ApiOperation({ summary: 'Get all connections for a showroom' })
  async getShowroomConnections(
    @Param('showroomId') showroomId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.svc.getShowroomConnections(
      showroomId,
      this.parseNumber(limit, 100),
      this.parseNumber(offset, 0),
    );
  }

  /** Get connection requests for the logged-in CA */
  @Get('ca/mine')
  @ApiOperation({ summary: 'Get all connection requests for the logged-in CA' })
  async getCAConnections(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const user = this.requireUser(req);
    return this.svc.getCAConnections(
      user.userId,
      this.parseNumber(limit, 100),
      this.parseNumber(offset, 0),
    );
  }

  // ── Reports ──────────────────────────────────────────────────────────────

  /** Showroom sends a report to a connected CA */
  @Post('reports/send')
  @ApiOperation({ summary: 'Showroom sends a report to their connected CA' })
  async sendReport(
    @Request() req: any,
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
      this.assertShowroomAccess(req, body.showroomId);
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
  @UseGuards(ShowroomAccessGuard)
  @ApiOperation({ summary: 'Get reports sent by a showroom' })
  async getShowroomReports(
    @Param('showroomId') showroomId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reportsSvc.getShowroomReports(
      showroomId,
      this.parseNumber(limit, 100),
      this.parseNumber(offset, 0),
    );
  }

  /** CA marks a report as read */
  @Patch('reports/:reportId/read')
  @ApiOperation({ summary: 'CA marks a report as read' })
  async markRead(@Param('reportId') reportId: string, @Request() req: any) {
    try {
      const user = this.requireUser(req);
      return await this.reportsSvc.markRead(reportId, user.userId);
    } catch (e: any) {
      throw new HttpException({ error: e.message }, e.status ?? HttpStatus.BAD_REQUEST);
    }
  }
}
