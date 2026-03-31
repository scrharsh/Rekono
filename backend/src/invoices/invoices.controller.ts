import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('showrooms')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post(':showroomId/invoices/generate-number')
  async generateNumber(@Param('showroomId') showroomId: string) {
    try {
      const invoiceNumber = await this.invoicesService.generateInvoiceNumber(showroomId);
      return { invoiceNumber };
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to generate invoice number' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':showroomId/invoices')
  async create(@Param('showroomId') showroomId: string, @Body() body: { saleId: string }) {
    try {
      const invoice = await this.invoicesService.createInvoice(showroomId, body.saleId);
      return {
        invoice,
        message: 'Invoice created successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to create invoice', details: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':showroomId/invoices/:invoiceNumber')
  async getByNumber(
    @Param('showroomId') showroomId: string,
    @Param('invoiceNumber') invoiceNumber: string,
  ) {
    try {
      const invoice = await this.invoicesService.getInvoiceByNumber(showroomId, invoiceNumber);
      return { invoice };
    } catch (error: any) {
      throw new HttpException({ error: 'Invoice not found' }, HttpStatus.NOT_FOUND);
    }
  }

  @Get(':showroomId/invoices')
  async list(
    @Param('showroomId') showroomId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const result = await this.invoicesService.listInvoices(
        showroomId,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 50,
      );
      return result;
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to list invoices' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
