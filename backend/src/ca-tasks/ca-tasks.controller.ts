import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaTasksService } from './ca-tasks.service';

@ApiTags('CA Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ca/tasks')
export class CaTasksController {
  constructor(private readonly caTasksService: CaTasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  async create(@Request() req: any, @Body() dto: any) {
    return this.caTasksService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tasks' })
  async findAll(@Request() req: any, @Query('clientId') clientId?: string, @Query('status') status?: string, @Query('priority') priority?: string) {
    return this.caTasksService.findAll(req.user.userId, { clientId, status, priority });
  }

  @Get('command-center')
  @ApiOperation({ summary: 'Get command center data' })
  async getCommandCenter(@Request() req: any) {
    return this.caTasksService.getCommandCenterData(req.user.userId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  async updateStatus(@Request() req: any, @Param('id') id: string, @Body() body: { status: string; notes?: string }) {
    return this.caTasksService.updateStatus(req.user.userId, id, body.status, body.notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.caTasksService.delete(req.user.userId, id);
  }
}
