import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShowroomAccessGuard } from '../auth/guards/showroom-access.guard';

@ApiTags('exports')
@ApiBearerAuth()
@Controller('showrooms')
@UseGuards(JwtAuthGuard, ShowroomAccessGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post(':showroomId/exports/tally')
  async generateTallyExport(
    @Param('showroomId') showroomId: string,
    @Body() body: { startDate: string; endDate: string },
    @Res() res: Response,
  ) {
    try {
      const { startDate, endDate } = body;

      if (!startDate || !endDate) {
        throw new HttpException(
          { error: 'Start date and end date are required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 365) {
        throw new HttpException(
          { error: 'Date range cannot exceed 1 year' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const excelBuffer = await this.exportsService.generateTallyExport(
        showroomId,
        startDate,
        endDate,
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=tally-export-${showroomId}-${Date.now()}.xlsx`,
      );
      res.send(excelBuffer);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { error: 'Failed to generate Tally export' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':showroomId/exports/gst-summary')
  async generateGSTSummary(
    @Param('showroomId') showroomId: string,
    @Body() body: { startDate: string; endDate: string },
  ) {
    try {
      const { startDate, endDate } = body;

      if (!startDate || !endDate) {
        throw new HttpException(
          { error: 'Start date and end date are required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 365) {
        throw new HttpException(
          { error: 'Date range cannot exceed 1 year' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const summary = await this.exportsService.generateGSTSummary(showroomId, startDate, endDate);
      return summary;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { error: 'Failed to generate GST summary' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
