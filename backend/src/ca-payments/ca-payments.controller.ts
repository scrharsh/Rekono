import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaPaymentsService } from './ca-payments.service';

@ApiTags('CA Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ca/payments')
export class CaPaymentsController {
  constructor(private readonly caPaymentsService: CaPaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a payment' })
  async create(@Request() req: any, @Body() dto: any) {
    return this.caPaymentsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all payments' })
  async findAll(@Request() req: any, @Query('clientId') clientId?: string, @Query('status') status?: string) {
    return this.caPaymentsService.findAll(req.user.userId, { clientId, status });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get pending/overdue summary' })
  async getSummary(@Request() req: any) {
    return this.caPaymentsService.getPendingSummary(req.user.userId);
  }

  @Put(':id/mark-paid')
  @ApiOperation({ summary: 'Mark payment as paid' })
  async markPaid(@Request() req: any, @Param('id') id: string, @Body() body: { paymentMethod: string; transactionRef?: string }) {
    return this.caPaymentsService.markPaid(req.user.userId, id, body.paymentMethod, body.transactionRef);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment record' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.caPaymentsService.delete(req.user.userId, id);
  }
}
