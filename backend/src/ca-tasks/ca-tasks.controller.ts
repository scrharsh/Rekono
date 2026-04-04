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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaTasksService } from './ca-tasks.service';
import { CreateCaTaskDto } from './dto/create-ca-task.dto';
import { BulkAssignCaTasksDto } from './dto/bulk-assign-ca-tasks.dto';
import { UpdateCaTaskStatusDto } from './dto/update-ca-task-status.dto';

@ApiTags('CA Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ca/tasks')
export class CaTasksController {
  constructor(private readonly caTasksService: CaTasksService) {}

  private parseNumber(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  async create(@Request() req: any, @Body() dto: CreateCaTaskDto) {
    return this.caTasksService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tasks' })
  async findAll(
    @Request() req: any,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.caTasksService.findAll(req.user.userId, {
      clientId,
      status,
      priority,
      limit: this.parseNumber(limit, 200),
      offset: this.parseNumber(offset, 0),
    });
  }

  @Get('assigned-to-me')
  @ApiOperation({ summary: 'Get tasks assigned to current user' })
  async getAssignedToMe(@Request() req: any, @Query('limit') limit?: string) {
    return this.caTasksService.getAssignedTasks(
      req.user.userId,
      req.user.userId,
      this.parseNumber(limit, 100),
    );
  }

  @Get('command-center')
  @ApiOperation({ summary: 'Get command center data' })
  async getCommandCenter(@Request() req: any) {
    return this.caTasksService.getCommandCenterData(req.user.userId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateCaTaskStatusDto,
  ) {
    return this.caTasksService.updateStatus(req.user.userId, id, body.status, body.notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.caTasksService.delete(req.user.userId, id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign task to a team member' })
  async assignTask(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { assignedToUserId: string; assignedToName: string; dueDate?: Date },
  ) {
    return this.caTasksService.assignTask(
      req.user.userId,
      id,
      body.assignedToUserId,
      body.assignedToName,
      body.dueDate,
    );
  }

  @Post('bulk-assign')
  @ApiOperation({ summary: 'Assign multiple tasks to a team member' })
  async bulkAssignTasks(@Request() req: any, @Body() body: BulkAssignCaTasksDto) {
    return this.caTasksService.bulkAssignTasks(
      req.user.userId,
      body.taskIds,
      body.assignedToUserId,
      body.assignedToName,
      body.dueDate ? new Date(body.dueDate) : undefined,
    );
  }

  @Get('team-overview')
  @ApiOperation({ summary: 'Get team task overview' })
  async getTeamOverview(@Request() req: any) {
    return this.caTasksService.getTeamOverview(req.user.userId);
  }
}
