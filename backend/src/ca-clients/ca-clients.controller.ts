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
import { CaClientsService } from './ca-clients.service';
import { CreateCaClientDto, UpdateCaClientDto } from './dto/ca-client.dto';

@ApiTags('CA Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ca/clients')
export class CaClientsController {
  constructor(private readonly caClientsService: CaClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  async create(@Request() req: any, @Body() dto: CreateCaClientDto) {
    return this.caClientsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all clients' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false })
  async findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.caClientsService.findAll(req.user.userId, { status, search, sortBy, order });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get CA dashboard stats' })
  async getStats(@Request() req: any) {
    return this.caClientsService.getStats(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  async findById(@Request() req: any, @Param('id') id: string) {
    return this.caClientsService.findById(req.user.userId, id);
  }

  @Get(':id/workspace')
  @ApiOperation({ summary: 'Get full client workspace' })
  async getWorkspace(@Request() req: any, @Param('id') id: string) {
    return this.caClientsService.getWorkspace(req.user.userId, id);
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Calculate client health score' })
  async getHealthScore(@Request() req: any, @Param('id') id: string) {
    return this.caClientsService.calculateHealthScore(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client' })
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCaClientDto) {
    return this.caClientsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.caClientsService.delete(req.user.userId, id);
  }
}
