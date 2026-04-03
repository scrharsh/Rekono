
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { ConfirmMatchDto } from './dto/confirm-match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShowroomAccessGuard } from '../auth/guards/showroom-access.guard';

@ApiTags('matching')
@ApiBearerAuth()
@Controller('showrooms')
@UseGuards(JwtAuthGuard, ShowroomAccessGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post(':showroomId/matches')
  @ApiOperation({ summary: 'Manually confirm a match between payment and sale' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiResponse({ status: 201, description: 'Match confirmed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or records belong to different showrooms',
  })
  @ApiResponse({ status: 404, description: 'Payment or sale not found' })
  @ApiResponse({ status: 409, description: 'Payment or sale already matched' })
  async create(
    @Param('showroomId') showroomId: string,
    @Body() confirmMatchDto: ConfirmMatchDto,
    @Request() req: any,
  ) {
    try {
      await this.matchingService.confirmMatch(
        confirmMatchDto.paymentId,
        confirmMatchDto.saleId,
        req.user.userId,
        undefined,
        confirmMatchDto.notes,
      );
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
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

  @Get(':showroomId/matches')
  @ApiOperation({ summary: 'Get all matches for a showroom' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiQuery({
    name: 'matchType',
    required: false,
    description: 'Filter by match type (auto|manual)',
  })
  @ApiQuery({ name: 'minConfidence', required: false, description: 'Minimum confidence score' })
  @ApiResponse({ status: 200, description: 'Matches retrieved successfully' })
  async findAll(
    @Param('showroomId') showroomId: string,
    @Query('matchType') matchType?: string,
    @Query('minConfidence') minConfidence?: string,
  ) {
    try {
      const matches = await this.matchingService.findAll(showroomId, {
        matchType,
        minConfidence: minConfidence ? Number(minConfidence) : undefined,
      });
      return { matches };
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

  @Get(':showroomId/matches/suggestions/:paymentId')
  @ApiOperation({ summary: 'Get match suggestions for a payment' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment Record ID' })
  @ApiResponse({ status: 200, description: 'Match suggestions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getSuggestions(
    @Param('showroomId') _showroomId: string,
    @Param('paymentId') paymentId: string,
  ) {
    try {
      const suggestions = await this.matchingService.getMatchSuggestions(paymentId);
      return { suggestions };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
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

  @Post(':showroomId/matches/:paymentId/quick-match')
  @ApiOperation({
    summary: 'Quick-match: Get top suggestion and confirm with one action (1-tap resolve)',
  })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment Record ID' })
  @ApiResponse({
    status: 200,
    description: 'Auto-matched or returned suggestions',
  })
  async quickMatch(
    @Param('showroomId') _showroomId: string,
    @Param('paymentId') paymentId: string,
    @Request() req: any,
  ) {
    try {
      const result = await this.matchingService.quickMatch(paymentId, req.user.userId);
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
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

  @Post(':showroomId/matches/bulk/suggestions')
  @ApiOperation({
    summary: 'Get all unmatched items with top suggestions (for bulk-resolve UI)',
  })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiResponse({
    status: 200,
    description: 'All unmatched sales/payments with suggestions',
  })
  async getBulkSuggestions(@Param('showroomId') showroomId: string) {
    try {
      return await this.matchingService.getBulkSuggestions(showroomId);
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

  @Post(':showroomId/matches/bulk/confirm')
  @ApiOperation({
    summary: 'Confirm multiple matches at once (bulk-resolve from dashboard)',
  })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiResponse({
    status: 200,
    description: 'Matches confirmed',
  })
  async confirmBulkMatches(
    @Param('showroomId') _showroomId: string,
    @Body() body: { matches: Array<{ paymentId: string; saleId: string }> },
    @Request() req: any,
  ) {
    try {
      const results = await Promise.allSettled(
        body.matches.map((m) =>
          this.matchingService.confirmMatch(m.paymentId, m.saleId, req.user.userId),
        ),
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return { successful, failed, results };
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

  @Delete(':showroomId/matches/:matchId')
  @ApiOperation({ summary: 'Remove a match and reset payment/sale statuses' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match removed successfully' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async unmatch(@Param('showroomId') _showroomId: string, @Param('matchId') matchId: string) {
    try {
      await this.matchingService.unmatch(matchId);
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
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

  @Get(':showroomId/sales/:saleId/split-payment-status')
  @ApiOperation({ summary: 'Get split payment breakdown for a sale' })
  @ApiParam({ name: 'showroomId', description: 'Showroom ID' })
  @ApiParam({ name: 'saleId', description: 'Sale Entry ID' })
  @ApiResponse({ status: 200, description: 'Split payment status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async getSplitPaymentStatus(
    @Param('showroomId') _showroomId: string,
    @Param('saleId') saleId: string,
  ) {
    try {
      return await this.matchingService.getSplitPaymentStatus(saleId);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
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
