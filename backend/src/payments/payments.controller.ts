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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { MatchingService } from '../matching/matching.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShowroomAccessGuard } from '../auth/guards/showroom-access.guard';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('showrooms')
@UseGuards(JwtAuthGuard, ShowroomAccessGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly matchingService: MatchingService,
  ) {}

  @Post(':showroomId/payments')
  @ApiOperation({ summary: 'Create a new payment record' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Param('showroomId') showroomId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: any,
  ) {
    try {
      const payment = await this.paymentsService.create(
        showroomId,
        createPaymentDto,
        req.user.userId,
      );

      // Trigger matching engine after payment creation (Requirement 4.1)
      await this.matchingService.autoMatch(payment);

      // Get match suggestions
      const matches = await this.matchingService.findMatches(payment);

      return { payment, matches };
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

  @Get(':showroomId/payments')
  @ApiOperation({ summary: 'Get all payments for a showroom' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO 8601)' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status: unmatched | matched | verified',
  })
  @ApiQuery({ name: 'paymentMethod', required: false, description: 'Filter by payment method' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based, default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page (default 50)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async findAll(
    @Param('showroomId') showroomId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 50;
      const parsedPage = page ? parseInt(page, 10) : 1;
      const offset = (parsedPage - 1) * parsedLimit;

      const result = await this.paymentsService.findAll(showroomId, {
        startDate,
        endDate,
        status,
        method: paymentMethod,
        limit: parsedLimit,
        offset,
      });

      return {
        ...result,
        page: parsedPage,
        limit: parsedLimit,
      };
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

  @Get(':showroomId/payments/:paymentId')
  @ApiOperation({ summary: 'Get a specific payment by ID' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(@Param('showroomId') showroomId: string, @Param('paymentId') paymentId: string) {
    try {
      const payment = await this.paymentsService.findOne(paymentId);
      if (!payment) {
        throw new HttpException(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Payment not found',
            },
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Verify payment belongs to the requested showroom
      if (payment.showroomId.toString() !== showroomId) {
        throw new HttpException(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Payment not found',
            },
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return { payment };
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
}
