import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HelpRequestsService } from './help-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('help-requests')
@ApiBearerAuth()
@Controller('help-requests')
@UseGuards(JwtAuthGuard)
export class HelpRequestsController {
  constructor(private readonly helpRequestsService: HelpRequestsService) {}

  @Post()
  async create(@Body() body: { showroomId: string; description: string }, @Request() req: any) {
    try {
      const userId = req.user.userId;
      const helpRequest = await this.helpRequestsService.create(
        body.showroomId,
        userId,
        body.description,
      );
      return helpRequest;
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to create help request' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll(@Query('status') status?: string) {
    try {
      const requests = await this.helpRequestsService.findAll(status);
      return requests;
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to fetch help requests' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':requestId/assign')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async assign(@Param('requestId') requestId: string, @Body() body: { accountantId: string }) {
    try {
      const helpRequest = await this.helpRequestsService.assign(requestId, body.accountantId);
      if (!helpRequest) {
        throw new HttpException({ error: 'Help request not found' }, HttpStatus.NOT_FOUND);
      }
      return helpRequest;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { error: 'Failed to assign help request' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':requestId/complete')
  async complete(@Param('requestId') requestId: string, @Body() body: { notes?: string }) {
    try {
      const helpRequest = await this.helpRequestsService.complete(requestId, body.notes);
      if (!helpRequest) {
        throw new HttpException({ error: 'Help request not found' }, HttpStatus.NOT_FOUND);
      }
      return helpRequest;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { error: 'Failed to complete help request' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
