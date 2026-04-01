import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('entity/:type/:id')
  @ApiOperation({ summary: 'Get audit history for an entity' })
  async getEntityHistory(@Param('type') type: string, @Param('id') id: string) {
    return this.auditService.getEntityHistory(type, id);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent activity' })
  async getRecent(@Query('type') type?: string, @Query('limit') limit?: number) {
    return this.auditService.getRecentActivity(type, limit || 100);
  }
}
