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
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShowroomAccessGuard } from '../auth/guards/showroom-access.guard';
import { Showroom, ShowroomDocument } from '../schemas/showroom.schema';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('showrooms')
@UseGuards(JwtAuthGuard, ShowroomAccessGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    @InjectModel(Showroom.name) private showroomModel: Model<ShowroomDocument>,
  ) {}

  @Get(':showroomId')
  @ApiOperation({ summary: 'Get showroom details' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiResponse({ status: 200, description: 'Showroom details' })
  @ApiResponse({ status: 404, description: 'Showroom not found' })
  async getShowroom(@Param('showroomId') showroomId: string) {
    try {
      const showroom = await this.showroomModel.findById(showroomId);
      if (!showroom) {
        throw new HttpException(
          { error: { code: 'NOT_FOUND', message: 'Showroom not found' } },
          HttpStatus.NOT_FOUND,
        );
      }
      return showroom;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { error: { code: 'SERVER_ERROR', message: error.message } },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':showroomId/sales')
  @ApiOperation({ summary: 'Create a new sale entry' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Param('showroomId') showroomId: string,
    @Body() createSaleDto: CreateSaleDto,
    @Request() req: any,
  ) {
    try {
      const userId = req?.user?.userId;
      if (!userId) {
        throw new HttpException(
          { error: { code: 'UNAUTHORIZED', message: 'Authenticated user is required' } },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const sale = await this.salesService.create(showroomId, createSaleDto, userId);
      return { sale };
    } catch (error: any) {
      throw new HttpException(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':showroomId/sales')
  @ApiOperation({ summary: 'Get all sales for a showroom' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset' })
  @ApiResponse({ status: 200, description: 'Sales retrieved successfully' })
  async findAll(
    @Param('showroomId') showroomId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.salesService.findAll(showroomId, {
        startDate,
        endDate,
        status,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      });
      return result;
    } catch (error: any) {
      throw new HttpException(
        {
          error: {
            code: 'SERVER_ERROR',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':showroomId/sales/:saleId')
  @ApiOperation({ summary: 'Get a specific sale by ID' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiParam({ name: 'saleId', description: 'Sale ID' })
  @ApiResponse({ status: 200, description: 'Sale retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async findOne(@Param('showroomId') showroomId: string, @Param('saleId') saleId: string) {
    try {
      const sale = await this.salesService.findOne(saleId);
      if (!sale) {
        throw new HttpException(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Sale not found',
            },
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return { sale };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          error: {
            code: 'SERVER_ERROR',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':showroomId/sales/:saleId')
  @ApiOperation({ summary: 'Update a sale entry' })
  async update(
    @Param('showroomId') _showroomId: string,
    @Param('saleId') saleId: string,
    @Body() updateData: any,
  ) {
    try {
      const sale = await this.salesService.update(saleId, updateData);
      if (!sale)
        throw new HttpException(
          { error: { code: 'NOT_FOUND', message: 'Sale not found' } },
          HttpStatus.NOT_FOUND,
        );
      return { sale };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { error: { code: 'SERVER_ERROR', message: error.message } },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':showroomId/sales/:saleId')
  @ApiOperation({ summary: 'Delete a sale entry' })
  async remove(@Param('showroomId') _showroomId: string, @Param('saleId') saleId: string) {
    try {
      await this.salesService.delete(saleId);
      return { success: true };
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'SERVER_ERROR', message: error.message } },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
