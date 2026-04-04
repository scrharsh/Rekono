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
import { CaPaymentsService } from './ca-payments.service';

@ApiTags('CA Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ca/payments')
export class CaPaymentsController {
  constructor(private readonly caPaymentsService: CaPaymentsService) {}

  private parseNumber(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  @Post()
  @ApiOperation({ summary: 'Record a payment' })
  async create(@Request() req: any, @Body() dto: any) {
    return this.caPaymentsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all payments' })
  async findAll(
    @Request() req: any,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.caPaymentsService.findAll(req.user.userId, {
      clientId,
      status,
      limit: this.parseNumber(limit, 200),
      offset: this.parseNumber(offset, 0),
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get pending/overdue summary' })
  async getSummary(@Request() req: any, @Query('sampleLimit') sampleLimit?: string) {
    return this.caPaymentsService.getPendingSummary(
      req.user.userId,
      this.parseNumber(sampleLimit, 250),
    );
  }

  @Get('aging-analysis')
  @ApiOperation({ summary: 'Get aging analysis of receivables' })
  async getAgingAnalysis(
    @Request() req: any,
    @Query('clientId') clientId?: string,
    @Query('sampleLimit') sampleLimit?: string,
  ) {
    return this.caPaymentsService.getAgingAnalysis(
      req.user.userId,
      clientId,
      this.parseNumber(sampleLimit, 250),
    );
  }

  @Put(':id/mark-paid')
  @ApiOperation({ summary: 'Mark payment as paid' })
  async markPaid(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { paymentMethod: string; transactionRef?: string },
  ) {
    return this.caPaymentsService.markPaid(
      req.user.userId,
      id,
      body.paymentMethod,
      body.transactionRef,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment record' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.caPaymentsService.delete(req.user.userId, id);
  }
}
