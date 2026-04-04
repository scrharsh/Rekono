import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaServicesService } from './ca-services.service';

@ApiTags('CA Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ca/services')
export class CaServicesController {
  constructor(private readonly caServicesService: CaServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service for a client' })
  async create(@Request() req: any, @Body() dto: any) {
    return this.caServicesService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all services' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'serviceType', required: false })
  async findAll(
    @Request() req: any,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('serviceType') serviceType?: string,
  ) {
    return this.caServicesService.findAll(req.user.userId, { clientId, status, serviceType });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get services summary' })
  async getSummary(@Request() req: any) {
    return this.caServicesService.getServicesSummary(req.user.userId);
  }

  @Get('period-insights')
  @ApiOperation({ summary: 'Get service period tracking insights' })
  async getPeriodInsights(@Request() req: any) {
    return this.caServicesService.getPeriodInsights(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  async findById(@Request() req: any, @Param('id') id: string) {
    return this.caServicesService.findById(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update service' })
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.caServicesService.update(req.user.userId, id, dto);
  }

  @Put(':id/period-status')
  @ApiOperation({ summary: 'Update period status for a service' })
  async updatePeriodStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { period: string; status: string; notes?: string },
  ) {
    return this.caServicesService.updatePeriodStatus(
      req.user.userId,
      id,
      body.period,
      body.status,
      body.notes,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.caServicesService.delete(req.user.userId, id);
  }
}
