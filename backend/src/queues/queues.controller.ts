import { Controller, Get, Param, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { QueuesService } from './queues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('queues')
@ApiBearerAuth()
@Controller('showrooms')
@UseGuards(JwtAuthGuard)
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get(':showroomId/queues/unmatched')
  @ApiOperation({ summary: 'Get unmatched sales queue' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiResponse({ status: 200, description: 'Unmatched queue retrieved successfully' })
  async getUnmatchedQueue(@Param('showroomId') showroomId: string) {
    try {
      const queue = await this.queuesService.getUnmatchedQueue(showroomId);
      return queue;
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to fetch unmatched queue' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':showroomId/queues/unknown')
  @ApiOperation({ summary: 'Get unknown payments queue' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiResponse({ status: 200, description: 'Unknown queue retrieved successfully' })
  async getUnknownQueue(@Param('showroomId') showroomId: string) {
    try {
      const queue = await this.queuesService.getUnknownQueue(showroomId);
      return queue;
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to fetch unknown queue' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
