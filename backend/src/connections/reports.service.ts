import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SharedReport, SharedReportDocument } from '../schemas/shared-report.schema';
import { Connection, ConnectionDocument } from '../schemas/connection.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(SharedReport.name) private reportModel: Model<SharedReportDocument>,
    @InjectModel(Connection.name) private connectionModel: Model<ConnectionDocument>,
  ) {}

  /** Showroom sends a report to their connected CA */
  async sendReport(
    showroomId: string,
    caUserId: string,
    reportType: string,
    fileName: string,
    period: string,
    notes?: string,
    fileUrl?: string,
  ): Promise<SharedReportDocument> {
    // Verify active connection exists
    const conn = await this.connectionModel.findOne({ showroomId, caUserId, status: 'active' });
    if (!conn) throw new ForbiddenException('No active connection with this CA');

    return this.reportModel.create({
      showroomId,
      caUserId,
      reportType,
      fileName,
      period,
      notes,
      fileUrl,
      status: 'unread',
    });
  }

  /** CA gets all reports sent to them */
  async getCAReports(caUserId: string): Promise<any[]> {
    return this.reportModel
      .find({ caUserId })
      .populate('showroomId', 'name gstin')
      .sort({ createdAt: -1 });
  }

  /** CA marks a report as read */
  async markRead(reportId: string, caUserId: string): Promise<SharedReportDocument> {
    const report = await this.reportModel.findById(reportId);
    if (!report) throw new NotFoundException('Report not found');
    if (report.caUserId.toString() !== caUserId) throw new ForbiddenException();

    report.status = 'read';
    report.readAt = new Date();
    return report.save();
  }

  /** Showroom gets reports they've sent */
  async getShowroomReports(showroomId: string): Promise<any[]> {
    return this.reportModel
      .find({ showroomId })
      .populate('caUserId', 'username')
      .sort({ createdAt: -1 });
  }
}
